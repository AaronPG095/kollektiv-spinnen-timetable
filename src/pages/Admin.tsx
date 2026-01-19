import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Upload, X as XIcon } from 'lucide-react';
import { getTicketSettings, updateTicketSettings, type TicketSettings } from '@/lib/ticketSettings';
import { getAllPurchases, confirmTicketPurchase, type TicketPurchase } from '@/lib/ticketPurchases';
import { 
  getAboutPageContent, 
  updateAboutPageContent, 
  getAboutPagePhotos, 
  uploadAboutPagePhoto, 
  updateAboutPagePhoto, 
  deleteAboutPagePhoto,
  type AboutPageContent as AboutPageContentType,
  type AboutPagePhoto 
} from '@/lib/aboutPage';
import { Loader2, Plus, Edit, Trash2, LogOut, Search, Eye, EyeOff, HelpCircle, ArrowUpDown, Calendar, Ticket, Info } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { FestivalHeader } from '@/components/FestivalHeader';
import { useDebounce } from '@/hooks/useDebounce';

interface DatabaseEvent {
  id: string;
  title: string;
  time: string;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  day: string;
  type: string;
  description: string | null;
  links: any;
  is_visible?: boolean;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order_index: number;
  is_visible: boolean;
  category?: string;
  subcategory?: string;
  language?: string;
}

const Admin = () => {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<DatabaseEvent | null>(null);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFAQCreateOpen, setIsFAQCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showHiddenMode, setShowHiddenMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "faqs" | "tickets" | "about">("events");
  const [ticketSettings, setTicketSettings] = useState<TicketSettings | null>(null);
  const [ticketSettingsLoading, setTicketSettingsLoading] = useState(false);
  const [ticketPurchases, setTicketPurchases] = useState<TicketPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [ticketSubTab, setTicketSubTab] = useState<"settings" | "purchases" | "checked">("settings");
  const [aboutPageContent, setAboutPageContent] = useState<AboutPageContentType | null>(null);
  const [aboutPagePhotos, setAboutPagePhotos] = useState<AboutPagePhoto[]>([]);
  const [aboutPageLoading, setAboutPageLoading] = useState(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const [checkedSearchQuery, setCheckedSearchQuery] = useState("");

  // Derived collections for ticket views
  const confirmedUncheckedPurchases = ticketPurchases.filter(
    (p) => p.status === 'confirmed' && !p.checked
  );
  const checkedConfirmedPurchases = ticketPurchases.filter(
    (p) => p.status === 'confirmed' && p.checked
  );

  // Filter purchases by search query (name and reference)
  const filterPurchasesBySearch = (purchases: TicketPurchase[], query: string) => {
    if (!query.trim()) return purchases;
    const lowerQuery = query.toLowerCase();
    return purchases.filter((p) => {
      const nameMatch = p.purchaser_name?.toLowerCase().includes(lowerQuery) ?? false;
      const referenceMatch = p.payment_reference?.toLowerCase().includes(lowerQuery) ?? false;
      return nameMatch || referenceMatch;
    });
  };

  const filteredPendingPurchases = filterPurchasesBySearch(confirmedUncheckedPurchases, pendingSearchQuery);
  const filteredCheckedPurchases = filterPurchasesBySearch(checkedConfirmedPurchases, checkedSearchQuery);

  useEffect(() => {
    // Allow all users to access admin page, but only load data if admin
    if (!authLoading) {
      if (isAdmin) {
        // Load all data in parallel for better performance
        // Use Promise.allSettled to handle partial failures gracefully
        Promise.allSettled([
          loadEvents(),
          loadFAQs(),
          loadTicketSettings(),
          loadAboutPageData(),
          loadTicketPurchases(),
        ]).then((results) => {
          // Check each result individually
          const errors = results
            .map((result, index) => ({ result, index }))
            .filter(({ result }) => result.status === 'rejected')
            .map(({ result, index }) => {
              const names = [
                t("dataSourceEvents"),
                t("dataSourceFAQs"),
                t("dataSourceTicketSettings"),
                t("dataSourceAboutPage"),
                t("dataSourceTicketPurchases")
              ];
              return {
                name: names[index] || t("dataSourceUnknown").replace('{index}', (index + 1).toString()),
                error: result.status === 'rejected' ? result.reason : null,
              };
            });

          if (errors.length > 0) {
            console.error('[Admin] Some data sources failed to load:', errors);
            // Only show toast if multiple failures or critical ones
            if (errors.length > 1 || errors.some(e => e.name === t("dataSourceTicketSettings"))) {
              toast({
                title: t("warning"),
                description: t("failedToLoadDataSources").replace('{count}', errors.length.toString()),
                variant: "destructive",
              });
            }
          }
        });
      } else {
        // Non-admin users can view the page but see a message
        setLoading(false);
      }
    }
  }, [isAdmin, authLoading]);

  const loadEvents = async () => {
    try {
      console.log('[Admin] Loading all events (admin view)...');
      
      // Admin should see all events including hidden ones
      // RLS policies should allow admins to see everything
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('day', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('[Admin] Supabase query error (events):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log(`[Admin] Successfully loaded ${data?.length || 0} events`);
      setEvents(data || []);
    } catch (error: any) {
      console.error('[Admin] Error loading events:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      toast({
        title: t("error"),
        description: error?.message || t("failedToLoadEvents"),
        variant: "destructive",
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    try {
      console.log('[Admin] Loading all FAQs (admin view)...');
      
      // Admin should see all FAQs including hidden ones
      // RLS policies should allow admins to see everything
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[Admin] Supabase query error (FAQs):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log(`[Admin] Successfully loaded ${data?.length || 0} FAQs`);
      setFaqs(data || []);
    } catch (error: any) {
      console.error('[Admin] Error loading FAQs:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      toast({
        title: t("error"),
        description: error?.message || t("failedToLoadFAQs"),
        variant: "destructive",
      });
      setFaqs([]);
    }
  };

  const loadTicketSettings = async () => {
    try {
      setTicketSettingsLoading(true);
      const settings = await getTicketSettings();
      setTicketSettings(settings);
    } catch (error: any) {
      console.error('[Admin] Error loading ticket settings:', error);
        toast({
          title: t("error"),
          description: error?.message || t("failedToLoadTicketSettings"),
          variant: "destructive",
        });
    } finally {
      setTicketSettingsLoading(false);
    }
  };

  const loadTicketPurchases = async () => {
    try {
      setPurchasesLoading(true);
      const purchases = await getAllPurchases();
      setTicketPurchases(purchases);
    } catch (error: any) {
      console.error('[Admin] Error loading confirmed Soli-Contributions:', error);
        toast({
          title: t("error"),
          description: error?.message || t("failedToLoadTicketPurchases"),
          variant: "destructive",
        });
    } finally {
      setPurchasesLoading(false);
    }
  };

  const handleConfirmPurchase = async (purchaseId: string) => {
    try {
      const result = await confirmTicketPurchase(purchaseId);
      if (result.success) {
        toast({ title: t("purchaseConfirmedSuccessfully") });
        loadTicketPurchases();
      } else {
        throw new Error(result.error || "Failed to confirm Soli-Contribution");
      }
    } catch (error: any) {
      console.error('[Admin] Error confirming Soli-Contribution:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToConfirmPurchase"),
        variant: "destructive",
      });
    }
  };

  const handleSaveTicketSettings = async (settings: Partial<TicketSettings>) => {
    try {
      console.log('[Admin] Saving ticket settings:', {
        settingsKeys: Object.keys(settings),
        settingsPreview: Object.entries(settings).slice(0, 5).reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as Record<string, any>),
      });
      
      const result = await updateTicketSettings(settings);
      if (result.success) {
        console.log('[Admin] Ticket settings saved successfully');
        toast({ title: t("ticketSettingsUpdatedSuccessfully") });
        // Reload settings after a short delay to ensure database has updated
        setTimeout(() => {
          loadTicketSettings();
        }, 500);
      } else {
        console.error('[Admin] Failed to save ticket settings:', result.error);
        // Show the specific error message from the database
        toast({
          title: t("error"),
          description: result.error || t("failedToSaveTicketSettings"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('[Admin] Exception saving ticket settings:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToSaveTicketSettings"),
        variant: "destructive",
      });
    }
  };

  const loadAboutPageData = async () => {
    try {
      setAboutPageLoading(true);
      const [content, photos] = await Promise.all([
        getAboutPageContent(),
        getAboutPagePhotos()
      ]);
      setAboutPageContent(content);
      setAboutPagePhotos(photos);
    } catch (error: any) {
      console.error('[Admin] Error loading about page data:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToLoadAboutPageData"),
        variant: "destructive",
      });
    } finally {
      setAboutPageLoading(false);
    }
  };

  const handleSaveAboutPageContent = async (content: Partial<AboutPageContentType>) => {
    try {
      await updateAboutPageContent(content);
      toast({ title: t("aboutPageContentUpdatedSuccessfully") });
      // Reload data to get updated content
      await loadAboutPageData();
    } catch (error: any) {
      console.error('[Admin] Error saving about page content:', error);
      toast({
        title: t("error"),
        description: error?.message || error?.details || t("failedToSaveAboutPageContent"),
        variant: "destructive",
      });
    }
  };

  const handleSaveEvent = async (eventData: Omit<DatabaseEvent, 'id'>) => {
    try {
      if (editingEvent) {
        console.log('[Admin] Updating event:', editingEvent.id);
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);
        
        if (error) {
          console.error('[Admin] Error updating event:', error);
          throw error;
        }
        toast({ title: t("eventUpdatedSuccessfully") });
      } else {
        console.log('[Admin] Creating new event');
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        
        if (error) {
          console.error('[Admin] Error creating event:', error);
          throw error;
        }
        toast({ title: t("eventCreatedSuccessfully") });
      }
      
      loadEvents();
      setEditingEvent(null);
      setIsCreateOpen(false);
    } catch (error: any) {
      console.error('[Admin] Error saving event:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToSaveEvent"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm(t("areYouSureDeleteEvent"))) return;
    
    try {
      console.log('[Admin] Deleting event:', id);
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('[Admin] Error deleting event:', error);
        throw error;
      }
      toast({ title: t("eventDeletedSuccessfully") });
      loadEvents();
    } catch (error: any) {
      console.error('[Admin] Error deleting event:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToDeleteEvent"),
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      console.log('[Admin] Toggling event visibility:', id, !currentVisibility);
      const { error } = await supabase
        .from('events')
        .update({ is_visible: !currentVisibility })
        .eq('id', id);
      
      if (error) {
        console.error('[Admin] Error toggling event visibility:', error);
        throw error;
      }
      toast({ 
        title: currentVisibility ? t("eventHiddenFromPublic") : t("eventMadeVisibleToPublic") 
      });
      loadEvents();
    } catch (error: any) {
      console.error('[Admin] Error toggling event visibility:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToUpdateEventVisibility"),
        variant: "destructive",
      });
    }
  };

  const handleSaveFAQ = async (faqData: Omit<FAQItem, 'id'>) => {
    try {
      if (editingFAQ) {
        console.log('[Admin] Updating FAQ:', editingFAQ.id);
        const { error } = await supabase
          .from('faqs')
          .update(faqData)
          .eq('id', editingFAQ.id);
        
        if (error) {
          console.error('[Admin] Error updating FAQ:', error);
          throw error;
        }
        toast({ title: t("faqUpdatedSuccessfully") });
      } else {
        console.log('[Admin] Creating new FAQ');
        const { error } = await supabase
          .from('faqs')
          .insert([faqData]);
        
        if (error) {
          console.error('[Admin] Error creating FAQ:', error);
          throw error;
        }
        toast({ title: t("faqCreatedSuccessfully") });
      }
      
      loadFAQs();
      setEditingFAQ(null);
      setIsFAQCreateOpen(false);
    } catch (error: any) {
      console.error('[Admin] Error saving FAQ:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToSaveFAQ"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm(t("areYouSureDeleteFAQ"))) return;
    
    try {
      console.log('[Admin] Deleting FAQ:', id);
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('[Admin] Error deleting FAQ:', error);
        throw error;
      }
      toast({ title: t("faqDeletedSuccessfully") });
      loadFAQs();
    } catch (error: any) {
      console.error('[Admin] Error deleting FAQ:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToDeleteFAQ"),
        variant: "destructive",
      });
    }
  };

  const handleToggleFAQVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      console.log('[Admin] Toggling FAQ visibility:', id, !currentVisibility);
      const { error } = await supabase
        .from('faqs')
        .update({ is_visible: !currentVisibility })
        .eq('id', id);
      
      if (error) {
        console.error('[Admin] Error toggling FAQ visibility:', error);
        throw error;
      }
      toast({ 
        title: currentVisibility ? t("faqHiddenFromPublic") : t("faqMadeVisibleToPublic") 
      });
      loadFAQs();
    } catch (error: any) {
      console.error('[Admin] Error toggling FAQ visibility:', error);
      toast({
        title: t("error"),
        description: error?.message || t("failedToUpdateFAQVisibility"),
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Filter events based on debounced search query
  const filteredEvents = events.filter(event => {
    const query = debouncedSearchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      event.day.toLowerCase().includes(query) ||
      event.type.toLowerCase().includes(query) ||
      (event.description && event.description.toLowerCase().includes(query))
    );
  });

  // Group events by day
  const eventsByDay = filteredEvents.reduce((acc, event) => {
    if (!acc[event.day]) {
      acc[event.day] = [];
    }
    acc[event.day].push(event);
    return acc;
  }, {} as Record<string, DatabaseEvent[]>);

  // Sort events within each day by time
  Object.keys(eventsByDay).forEach(day => {
    eventsByDay[day].sort((a, b) => {
      const timeA = a.time.split(' - ')[0];
      const timeB = b.time.split(' - ')[0];
      return timeA.localeCompare(timeB);
    });
  });

  // Define day order
  const dayOrder = ["Freitag", "Samstag", "Sonntag"];
  const sortedDays = dayOrder.filter(day => eventsByDay[day] && eventsByDay[day].length > 0);

  if (authLoading || (loading && isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show message to non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <FestivalHeader />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">{t("accessDenied")}</h2>
              <p className="text-muted-foreground mb-4">{t("noAdminPermissions")}</p>
              <Button onClick={() => navigate('/')} variant="default">
                {t("backToFestival")}
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FestivalHeader />
      <div className="flex-1 p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t("adminDashboard")}
            </h1>
            {/* Tab Navigation - Centered */}
            <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
              <Button
                variant={activeTab === "about" ? "default" : "ghost"}
                onClick={() => setActiveTab("about")}
                className="gap-2 text-sm py-2 px-3"
                size="sm"
              >
                <Info className="h-3 w-3" />
                {t("aboutUs")}
              </Button>
              <Button
                variant={activeTab === "events" ? "default" : "ghost"}
                onClick={() => setActiveTab("events")}
                className="gap-2 text-sm py-2 px-3"
                size="sm"
              >
                <Calendar className="h-3 w-3" />
                {t("events")}
              </Button>
              <Button
                variant={activeTab === "faqs" ? "default" : "ghost"}
                onClick={() => setActiveTab("faqs")}
                className="gap-2 text-sm py-2 px-3"
                size="sm"
              >
                <HelpCircle className="h-3 w-3" />
                {t("faqs")}
              </Button>
              <Button
                variant={activeTab === "tickets" ? "default" : "ghost"}
                onClick={() => setActiveTab("tickets")}
                className="gap-2 text-sm py-2 px-3"
                size="sm"
              >
                <Ticket className="h-3 w-3" />
                {t("tickets")}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={() => navigate('/')} variant="outline">
                {t("backToFestival")}
              </Button>
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="h-4 w-4 mr-2" />
                {t("signOut")}
              </Button>
            </div>
          </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {activeTab === "events" ? t("eventsManagement") : activeTab === "faqs" ? t("faqManagement") : activeTab === "tickets" ? t("ticketSettings") : t("aboutUsManagement")}
          </h2>
          <div className="flex gap-3">
            {activeTab === "events" ? (
              <>
                <Button
                  variant={showHiddenMode ? "default" : "outline"}
                  onClick={() => setShowHiddenMode(!showHiddenMode)}
                  className="min-h-[44px]"
                >
                  {showHiddenMode ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      {t("hiddenMode")}
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      {t("showAll")}
                    </>
                  )}
                </Button>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="min-h-[44px]">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addEvent")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] mx-4 sm:mx-auto overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t("createNewEvent")}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[75vh] overflow-y-auto pr-2">
                      <EventForm onSave={handleSaveEvent} />
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : activeTab === "faqs" ? (
              <Dialog open={isFAQCreateOpen} onOpenChange={setIsFAQCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="min-h-[44px]">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("addFAQ")}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] mx-4 sm:mx-auto overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t("createNewFAQ")}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[75vh] overflow-y-auto pr-2">
                    <FAQForm onSave={handleSaveFAQ} />
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </div>

        {/* Search Bar - only show for events tab */}
        {activeTab === "events" && (
          <div className="mb-8">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t("searchEvents")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-3">
              {t("showing")} {filteredEvents.length} {t("of")} {events.length} {filteredEvents.length === 1 ? t("event") : t("events_plural")}
            </p>
          )}
          </div>
        )}

        {activeTab === "events" ? (
          <div className="w-full">
            {sortedDays.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>{t("noEventsFound")}</p>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {sortedDays.map((day) => (
                  <div key={day} className="flex-shrink-0 w-[calc(33.333%-16px)] min-w-[280px] space-y-4">
                    {/* Day Header */}
                    <div className="flex items-center gap-3 pb-2 border-b border-border">
                      <h3 className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {day}
                      </h3>
                       <span className="text-sm text-muted-foreground">
                         ({eventsByDay[day].length} {eventsByDay[day].length === 1 ? t("event") : t("events_plural")})
                       </span>
                    </div>

                    {/* Events for this day */}
                    <div className="space-y-6">
                      {eventsByDay[day].map((event) => {
                        const typeConfig = {
                          performance: { label: "Performance", color: "type-performance" },
                          dj: { label: "DJ", color: "type-dj" },
                          workshop: { label: "Workshop", color: "type-workshop" },
                          live: { label: "Live", color: "type-live" },
                          interaktiv: { label: "Interaktiv", color: "type-interaktiv" }
                        };
                        const type = typeConfig[event.type as keyof typeof typeConfig] || typeConfig.performance;
                        
                        return (
                        <Card 
                          key={event.id} 
                          className={event.is_visible === false ? "border-destructive/50 bg-destructive/5" : "border-2"}
                          style={event.is_visible !== false ? {
                            backgroundColor: `hsl(var(--${type.color}) / 0.2)`,
                            borderColor: `hsl(var(--${type.color}) / 0.6)`
                          } : {}}
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">{event.title}</h3>
                                   {event.is_visible === false ? (
                                     <div className="flex items-center text-destructive text-xs">
                                       <EyeOff className="h-3 w-3 mr-1" />
                                       {t("hidden")}
                                     </div>
                                  ) : (
                                    <div 
                                      className="px-2 py-1 rounded text-xs font-medium border shrink-0"
                                      style={{
                                        backgroundColor: `hsl(var(--${type.color}) / 0.3)`,
                                        color: `hsl(var(--${type.color}))`,
                                        borderColor: `hsl(var(--${type.color}) / 0.5)`
                                      }}
                                    >
                                      {type.label}
                                    </div>
                                  )}
                                </div>
                                <p className="text-muted-foreground mb-2">
                                  {event.time} • {event.venue} • {event.type}
                                </p>
                                {event.description && (
                                  <div className="text-sm text-muted-foreground mt-2">
                                    {(() => {
                                      try {
                                        const parsed = JSON.parse(event.description);
                                        if (typeof parsed === 'object' && (parsed.en || parsed.de)) {
                                          return (
                                            <div className="space-y-1">
                                              {parsed.de && <div><strong>DE:</strong> {parsed.de}</div>}
                                              {parsed.en && <div><strong>EN:</strong> {parsed.en}</div>}
                                            </div>
                                          );
                                        }
                                      } catch {
                                        // If not JSON, display as is
                                      }
                                      return <div>{event.description}</div>;
                                    })()}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-3">
                                <Button
                                  variant={event.is_visible === false ? "default" : "outline"}
                                  size="sm"
                                   onClick={() => handleToggleVisibility(event.id, event.is_visible !== false)}
                                   title={event.is_visible === false ? t("makeVisible") : t("hideFromPublic")}
                                >
                                  {event.is_visible === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => setEditingEvent(event)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] mx-4 sm:mx-auto overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{t("editEvent")}</DialogTitle>
                          </DialogHeader>
                                    <div className="max-h-[75vh] overflow-y-auto pr-2">
                                      <EventForm 
                                        onSave={handleSaveEvent} 
                                        initialEvent={event}
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => handleDeleteEvent(event.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "faqs" ? (
          <div className="space-y-8">
            {(() => {
              // Group FAQs by category
              const faqsByCategory = faqs.reduce((acc, faq) => {
                const category = faq.category || 'Uncategorized';
                if (!acc[category]) {
                  acc[category] = [];
                }
                acc[category].push(faq);
                return acc;
              }, {} as Record<string, FAQItem[]>);

              // Sort categories
              const sortedCategories = Object.keys(faqsByCategory).sort();

              return sortedCategories.map((category) => {
                const categoryFAQs = faqsByCategory[category];
                
                // Group FAQs by subcategory within category
                const faqsBySubcategory = categoryFAQs.reduce((acc, faq) => {
                  const subcategory = faq.subcategory || 'General';
                  if (!acc[subcategory]) {
                    acc[subcategory] = [];
                  }
                  acc[subcategory].push(faq);
                  return acc;
                }, {} as Record<string, FAQItem[]>);

                // Sort subcategories
                const sortedSubcategories = Object.keys(faqsBySubcategory).sort();

                return (
                  <div key={category} className="space-y-6">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 pb-2 border-b border-border">
                      <h3 className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {category}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                         ({categoryFAQs.length} {categoryFAQs.length === 1 ? t("faq") : t("faqs")})
                      </span>
                    </div>

                    {/* Subcategories */}
                    {sortedSubcategories.map((subcategory) => {
                      const subcategoryFAQs = faqsBySubcategory[subcategory];
                      
                      // Group FAQs by order_index (matching questions in different languages)
                      const faqsByOrder = subcategoryFAQs.reduce((acc, faq) => {
                        const orderKey = faq.order_index.toString();
                        if (!acc[orderKey]) {
                          acc[orderKey] = [];
                        }
                        acc[orderKey].push(faq);
                        return acc;
                      }, {} as Record<string, FAQItem[]>);

                      // Sort by order_index
                      const sortedOrders = Object.keys(faqsByOrder).sort((a, b) => parseInt(a) - parseInt(b));

                      return (
                        <div key={subcategory} className="space-y-4 ml-4">
                          {/* Subcategory Header */}
                          <div className="flex items-center gap-2 pb-1 border-b border-border/50">
                            <h4 className="text-lg md:text-xl font-semibold text-foreground">
                              {subcategory}
                            </h4>
                             <span className="text-xs text-muted-foreground">
                               ({subcategoryFAQs.length} {subcategoryFAQs.length === 1 ? t("faq") : t("faqs")})
                             </span>
                          </div>

                          {/* FAQs grouped by question (order_index) */}
                          <div className="space-y-4">
                            {sortedOrders.map((orderKey) => {
                              const questionFAQs = faqsByOrder[orderKey];
                              const germanFAQ = questionFAQs.find(faq => faq.language === 'de') || questionFAQs[0];
                              const englishFAQ = questionFAQs.find(faq => faq.language === 'en') || questionFAQs[0];

                        return (
                          <div key={orderKey} className="flex gap-4">
                            {/* German FAQ Card */}
                            <Card className={`flex-1 ${germanFAQ.is_visible === false ? "border-destructive/50 bg-destructive/5" : ""}`}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-semibold text-muted-foreground uppercase">DE</span>
                                       {germanFAQ.is_visible === false && (
                                         <div className="flex items-center text-destructive text-xs">
                                           <EyeOff className="h-3 w-3 mr-1" />
                                           {t("hidden")}
                                         </div>
                                       )}
                                    </div>
                                    <h3 className="font-semibold text-base mb-1">{germanFAQ.question}</h3>
                                    <div className="text-sm text-muted-foreground mt-2">
                                      {germanFAQ.answer}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      variant={germanFAQ.is_visible === false ? "default" : "outline"}
                                      size="sm"
                                       onClick={() => handleToggleFAQVisibility(germanFAQ.id, germanFAQ.is_visible !== false)}
                                       title={germanFAQ.is_visible === false ? t("makeVisible") : t("hideFromPublic")}
                                    >
                                      {germanFAQ.is_visible === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </Button>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setEditingFAQ(germanFAQ)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl max-h-[90vh] mx-4 sm:mx-auto overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>{t("editFAQ")}</DialogTitle>
                                        </DialogHeader>
                                        <div className="max-h-[75vh] overflow-y-auto pr-2">
                                          <FAQForm 
                                            onSave={handleSaveFAQ} 
                                            initialFAQ={germanFAQ}
                                          />
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => handleDeleteFAQ(germanFAQ.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            {/* English FAQ Card */}
                            <Card className={`flex-1 ${englishFAQ.is_visible === false ? "border-destructive/50 bg-destructive/5" : ""}`}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-xs font-semibold text-muted-foreground uppercase">EN</span>
                                       {englishFAQ.is_visible === false && (
                                         <div className="flex items-center text-destructive text-xs">
                                           <EyeOff className="h-3 w-3 mr-1" />
                                           {t("hidden")}
                                         </div>
                                       )}
                                    </div>
                                    <h3 className="font-semibold text-base mb-1">{englishFAQ.question}</h3>
                                    <div className="text-sm text-muted-foreground mt-2">
                                      {englishFAQ.answer}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 flex-shrink-0">
                                    <Button
                                      variant={englishFAQ.is_visible === false ? "default" : "outline"}
                                      size="sm"
                                       onClick={() => handleToggleFAQVisibility(englishFAQ.id, englishFAQ.is_visible !== false)}
                                       title={englishFAQ.is_visible === false ? t("makeVisible") : t("hideFromPublic")}
                                    >
                                      {englishFAQ.is_visible === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </Button>
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm"
                                          onClick={() => setEditingFAQ(englishFAQ)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-2xl max-h-[90vh] mx-4 sm:mx-auto overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>{t("editFAQ")}</DialogTitle>
                                        </DialogHeader>
                                        <div className="max-h-[75vh] overflow-y-auto pr-2">
                                          <FAQForm 
                                            onSave={handleSaveFAQ} 
                                            initialFAQ={englishFAQ}
                                          />
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                    <Button 
                                      variant="destructive" 
                                      size="sm"
                                      onClick={() => handleDeleteFAQ(englishFAQ.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        ) : activeTab === "tickets" ? (
          <div className="w-full space-y-4">
            {/* Sub-tabs for Tickets */}
            <div className="flex gap-2 border-b border-border pb-2">
              <Button
                type="button"
                variant={ticketSubTab === "settings" ? "default" : "ghost"}
                onClick={() => setTicketSubTab("settings")}
                size="sm"
              >
                {t("ticketSettings")}
              </Button>
              <Button
                type="button"
                variant={ticketSubTab === "purchases" ? "default" : "ghost"}
                onClick={() => {
                  setTicketSubTab("purchases");
                  loadTicketPurchases();
                }}
                size="sm"
              >
                {t("pendingSoliContributions")} ({confirmedUncheckedPurchases.length})
              </Button>
              <Button
                type="button"
                variant={ticketSubTab === "checked" ? "default" : "ghost"}
                onClick={() => {
                  setTicketSubTab("checked");
                  loadTicketPurchases();
                }}
                size="sm"
              >
                {t("checkedSoliContributions")} ({checkedConfirmedPurchases.length})
              </Button>
            </div>

            {ticketSubTab === "settings" ? (
              ticketSettingsLoading ? (
                <div className="text-center text-muted-foreground py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>{t("loadingTicketSettings")}</p>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <TicketSettingsForm 
                      onSave={handleSaveTicketSettings}
                      initialSettings={ticketSettings}
                    />
                  </CardContent>
                </Card>
              )
            ) : ticketSubTab === "purchases" ? (
              purchasesLoading ? (
                <div className="text-center text-muted-foreground py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>{t("loadingPurchases")}</p>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("pendingSoliContributions")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {confirmedUncheckedPurchases.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">{t("noPurchasesYet")}</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search by name or reference..."
                            value={pendingSearchQuery}
                            onChange={(e) => setPendingSearchQuery(e.target.value)}
                            className="max-w-sm"
                          />
                        </div>
                        {filteredPendingPurchases.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            {pendingSearchQuery ? t("noResultsFound") || "No results found" : t("noPurchasesYet")}
                          </p>
                        ) : (
                          filteredPendingPurchases.map((purchase) => {
                          // Determine border color: checked = green, unchecked = red
                          const borderClass = purchase.checked ? 'border-green-500' : 'border-red-500';
                          
                          return (
                          <Card key={purchase.id} className={borderClass}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{purchase.purchaser_name}</span>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      purchase.status === 'confirmed' ? 'bg-green-500/20 text-green-700' :
                                      purchase.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                                      'bg-gray-500/20 text-gray-700'
                                    }`}>
                                      {purchase.status === 'pending' ? t("pending") : 
                                       purchase.status === 'confirmed' ? t("confirmed") : 
                                       t("cancelled")}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{purchase.purchaser_email}</p>
                                  <p className="text-sm">
                                    <span className="font-medium">{purchase.contribution_type}</span> - {purchase.role} - {purchase.price.toFixed(2)}€
                                  </p>
                                  {purchase.payment_reference && (
                                    <p className="text-xs text-muted-foreground">{t("payment")}: {purchase.payment_reference}</p>
                                  )}
                                  {purchase.notes && (
                                    <p className="text-xs text-muted-foreground">{t("notes")}: {purchase.notes}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(purchase.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <input
                                      type="checkbox"
                                      checked={purchase.checked}
                                      onChange={async (e) => {
                                        try {
                                          const nextChecked = e.target.checked;
                                          const { error } = await supabase
                                            .from('soli_contribution_purchases')
                                            .update({ checked: nextChecked })
                                            .eq('id', purchase.id);

                                          if (error) {
                                            console.error('[Admin] Error updating checked flag:', error);
                                            toast({
                                              title: t("error"),
                                              description: error.message || t("failedToUpdateCheckedState"),
                                              variant: "destructive",
                                            });
                                          } else {
                                            // Update local state optimistically
                                            setTicketPurchases(prev =>
                                              prev.map(p =>
                                                p.id === purchase.id ? { ...p, checked: nextChecked } : p
                                              )
                                            );
                                          }
                                        } catch (err: any) {
                                          console.error('[Admin] Exception updating checked flag:', err);
                                          toast({
                                            title: t("error"),
                                            description: err?.message || t("failedToUpdateCheckedState"),
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                    />
                                    <span>{t("checked")}</span>
                                  </label>

                                  {purchase.status === 'pending' && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleConfirmPurchase(purchase.id)}
                                    >
                                      {t("confirm")}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          );
                        })
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            ) : (
              // Checked Soli-Contributions tab
              purchasesLoading ? (
                <div className="text-center text-muted-foreground py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>{t("loadingCheckedPurchases")}</p>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("checkedSoliContributions")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {checkedConfirmedPurchases.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {t("noCheckedPurchasesYet")}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search by name or reference..."
                            value={checkedSearchQuery}
                            onChange={(e) => setCheckedSearchQuery(e.target.value)}
                            className="max-w-sm"
                          />
                        </div>
                        {filteredCheckedPurchases.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            {checkedSearchQuery ? t("noResultsFound") || "No results found" : t("noCheckedPurchasesYet")}
                          </p>
                        ) : (
                          filteredCheckedPurchases.map((purchase) => (
                            <Card key={purchase.id} className="border-green-500">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">{purchase.purchaser_name}</span>
                                      <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-700">
                                        {t("checked")}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{purchase.purchaser_email}</p>
                                    <p className="text-sm">
                                      <span className="font-medium">{purchase.contribution_type}</span> - {purchase.role} - {purchase.price.toFixed(2)}€
                                    </p>
                                    {purchase.payment_reference && (
                                      <p className="text-xs text-muted-foreground">{t("payment")}: {purchase.payment_reference}</p>
                                    )}
                                    {purchase.notes && (
                                      <p className="text-xs text-muted-foreground">{t("notes")}: {purchase.notes}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(purchase.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <input
                                        type="checkbox"
                                        checked={purchase.checked}
                                        onChange={async (e) => {
                                          try {
                                            const nextChecked = e.target.checked;
                                            const { error } = await supabase
                                              .from('soli_contribution_purchases')
                                              .update({ checked: nextChecked })
                                              .eq('id', purchase.id);

                                            if (error) {
                                              console.error('[Admin] Error updating checked flag:', error);
                                              toast({
                                                title: t("error"),
                                                description: error.message || t("failedToUpdateCheckedState"),
                                                variant: "destructive",
                                              });
                                            } else {
                                              // Update local state optimistically
                                              setTicketPurchases(prev =>
                                                prev.map(p =>
                                                  p.id === purchase.id ? { ...p, checked: nextChecked } : p
                                                )
                                              );
                                              
                                              // If unchecked, switch back to purchases tab to see the card
                                              if (!nextChecked && ticketSubTab === 'checked') {
                                                setTicketSubTab('purchases');
                                              }
                                            }
                                          } catch (err: any) {
                                            console.error('[Admin] Exception updating checked flag:', err);
                                            toast({
                                              title: t("error"),
                                              description: err?.message || t("failedToUpdateCheckedState"),
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                      />
                                      <span>{t("checked")}</span>
                                    </label>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            )}
          </div>
        ) : activeTab === "about" ? (
          <div className="w-full">
             {aboutPageLoading ? (
               <div className="text-center text-muted-foreground py-12">
                 <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                 <p>{t("loadingAboutPageData")}</p>
               </div>
            ) : (
              <AboutPageForm 
                onSaveContent={handleSaveAboutPageContent}
                initialContent={aboutPageContent}
                photos={aboutPagePhotos}
                onPhotosChange={loadAboutPageData}
              />
            )}
          </div>
        ) : null}
        </div>
      </div>
      <Footer />
    </div>
  );
};

interface EventFormProps {
  onSave: (event: Omit<DatabaseEvent, 'id'>) => void;
  initialEvent?: DatabaseEvent;
}

const EventForm = ({ onSave, initialEvent }: EventFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Parse description to get separate language versions
  const parseDescription = (desc: string | null) => {
    if (!desc) return { en: '', de: '' };
    
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(desc);
      if (typeof parsed === 'object' && parsed.en !== undefined && parsed.de !== undefined) {
        return { en: parsed.en || '', de: parsed.de || '' };
      }
    } catch {
      // If not JSON, treat as plain text (legacy format)
    }
    
    // For legacy events or plain text, put in German field
    return { en: '', de: desc || '' };
  };

  // Parse links to array format for editing
  const parseLinksToArray = (links: any) => {
    if (!links || typeof links !== 'object') return [];
    return Object.entries(links).map(([platform, url], index) => ({
      id: `${platform}-${index}`,
      platform,
      url: url as string
    }));
  };

  const initialDescriptions = parseDescription(initialEvent?.description);
  const initialLinks = parseLinksToArray(initialEvent?.links);

  const [formData, setFormData] = useState({
    title: initialEvent?.title || '',
    time: initialEvent?.time || '',
    start_time: initialEvent?.start_time || '',
    end_time: initialEvent?.end_time || '',
    venue: initialEvent?.venue || '',
    day: initialEvent?.day || '',
    type: initialEvent?.type || '',
    description_en: initialDescriptions.en,
    description_de: initialDescriptions.de,
    links: initialEvent?.links || {}
  });

  const [linksArray, setLinksArray] = useState(initialLinks);
  const [newLink, setNewLink] = useState({ platform: '', url: '' });

  const addLink = () => {
    if (newLink.platform.trim() && newLink.url.trim()) {
        // Validate URL
        try {
          const urlObj = new URL(newLink.url.trim());
          if (!['http:', 'https:'].includes(urlObj.protocol)) {
            toast({
              title: t("invalidURL"),
              description: t("urlMustStartWithHttp"),
              variant: "destructive",
            });
            return;
          }
        } catch {
          toast({
            title: t("invalidURL"),
            description: t("pleaseEnterValidURL"),
            variant: "destructive",
          });
          return;
        }
      
      const linkObj = {
        id: `${newLink.platform}-${Date.now()}`,
        platform: newLink.platform.trim(),
        url: newLink.url.trim()
      };
      setLinksArray([...linksArray, linkObj]);
      setNewLink({ platform: '', url: '' });
    }
  };

  const removeLink = (id: string) => {
    setLinksArray(linksArray.filter(link => link.id !== id));
  };

  const updateLink = (id: string, field: 'platform' | 'url', value: string) => {
    setLinksArray(linksArray.map(link => 
      link.id === id ? { ...link, [field]: value } : link
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine descriptions into JSON format
    const description = JSON.stringify({
      en: formData.description_en,
      de: formData.description_de
    });

    // Convert links array back to object format
    const linksObject = linksArray.reduce((acc, link) => {
      acc[link.platform] = link.url;
      return acc;
    }, {} as Record<string, string>);
    
    const { description_en, description_de, ...eventData } = formData;
    onSave({ ...eventData, description, links: linksObject });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">{t("eventTitle")} *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">{t("eventTime")} *</Label>
          <Input
            id="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            placeholder="19:00 - 20:00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">{t("startTime")}</Label>
          <Input
            id="start_time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            placeholder="19:00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">{t("endTime")}</Label>
          <Input
            id="end_time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            placeholder="20:00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="day">{t("eventDay")} *</Label>
          <Select 
            value={formData.day} 
            onValueChange={(value) => setFormData({ ...formData, day: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectDay")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Freitag">{t("freitag")}</SelectItem>
              <SelectItem value="Samstag">{t("samstag")}</SelectItem>
              <SelectItem value="Sonntag">{t("sonntag")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">{t("eventVenue")} *</Label>
          <Select 
            value={formData.venue} 
            onValueChange={(value) => setFormData({ ...formData, venue: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectVenue")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draussen">{t("draussen")}</SelectItem>
              <SelectItem value="oben">{t("oben")}</SelectItem>
              <SelectItem value="unten">{t("unten")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">{t("eventType")} *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">{t("live")}</SelectItem>
              <SelectItem value="dj">{t("dj")}</SelectItem>
              <SelectItem value="performance">{t("performance")}</SelectItem>
              <SelectItem value="workshop">{t("workshop")}</SelectItem>
              <SelectItem value="interaktiv">{t("interaktiv")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description_de">{t("descriptionGerman")}</Label>
          <Textarea
            id="description_de"
            value={formData.description_de}
            onChange={(e) => setFormData({ ...formData, description_de: e.target.value })}
            rows={3}
            placeholder={t("germanDescriptionPlaceholder")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description_en">{t("descriptionEnglish")}</Label>
          <Textarea
            id="description_en"
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            rows={3}
            placeholder={t("englishDescriptionPlaceholder")}
          />
        </div>
      </div>

      {/* Links Management */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">{t("links")}</Label>
        
        {/* Existing Links */}
        {linksArray.length > 0 && (
          <div className="space-y-3">
            {linksArray.map((link) => (
              <div key={link.id} className="flex gap-2 items-center p-3 border rounded-md bg-muted/50">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder={t("platformPlaceholder")}
                    value={link.platform}
                    onChange={(e) => updateLink(link.id, 'platform', e.target.value)}
                  />
                  <Input
                    placeholder={t("urlPlaceholder")}
                    value={link.url}
                    onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeLink(link.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Link */}
        <div className="p-3 border-2 border-dashed rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
            <Input
              placeholder={t("platformPlaceholder")}
              value={newLink.platform}
              onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
            />
            <Input
              placeholder={t("urlPlaceholder")}
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addLink}
            disabled={!newLink.platform.trim() || !newLink.url.trim()}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t("addLink")}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {initialEvent ? t("updateEvent") : t("createEvent")}
      </Button>
    </form>
  );
};

interface FAQFormProps {
  onSave: (faq: Omit<FAQItem, 'id'>) => void;
  initialFAQ?: FAQItem;
}

const FAQForm = ({ onSave, initialFAQ }: FAQFormProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    question: initialFAQ?.question || '',
    answer: initialFAQ?.answer || '',
    order_index: initialFAQ?.order_index || 0,
    is_visible: initialFAQ?.is_visible ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">{t("question")} *</Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          required
          placeholder={t("enterQuestionPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">{t("answer")} *</Label>
        <Textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          required
          rows={4}
          placeholder={t("enterAnswerPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="order_index">{t("displayOrder")}</Label>
        <Input
          id="order_index"
          type="number"
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
          placeholder="0"
          min="0"
        />
        <p className="text-xs text-muted-foreground">
          {t("lowerNumbersAppearFirst")}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_visible"
          checked={formData.is_visible}
          onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
          className="rounded border-border"
        />
        <Label htmlFor="is_visible">{t("visibleToPublic")}</Label>
      </div>

      <Button type="submit" className="w-full">
        {initialFAQ ? t("updateFAQ") : t("createFAQ")}
      </Button>
    </form>
  );
};

interface TicketSettingsFormProps {
  onSave: (settings: Partial<TicketSettings>) => void;
  initialSettings?: TicketSettings | null;
}

const TicketSettingsForm = ({ onSave, initialSettings }: TicketSettingsFormProps) => {
  const { t } = useLanguage();
  const standardRoles = [
    { key: "bar", label: "Bar Helper" },
    { key: "kuechenhilfe", label: "Kitchen Helper" },
    { key: "springerRunner", label: "Springer Runner" },
    { key: "springerToilet", label: "Springer Toilet" },
  ] as const;

  const reducedRoles = [
    { key: "abbau", label: "Abbau" },
    { key: "aufbau", label: "Aufbau" },
    { key: "awareness", label: "Awareness" },
    { key: "schichtleitung", label: "Schichtleitung" },
  ] as const;

  type RoleKey = typeof standardRoles[number]["key"] | typeof reducedRoles[number]["key"];

  const limitFieldByRole: Record<RoleKey, keyof TicketSettings> = {
    bar: "bar_limit",
    kuechenhilfe: "kuechenhilfe_limit",
    springerRunner: "springer_runner_limit",
    springerToilet: "springer_toilet_limit",
    abbau: "abbau_limit",
    aufbau: "aufbau_limit",
    awareness: "awareness_limit",
    schichtleitung: "schichtleitung_limit",
  };

  const priceFieldByRole: Record<RoleKey, { early: keyof TicketSettings; normal: keyof TicketSettings }> = {
    bar: { early: "bar_price_early", normal: "bar_price_normal" },
    kuechenhilfe: { early: "kuechenhilfe_price_early", normal: "kuechenhilfe_price_normal" },
    springerRunner: { early: "springer_runner_price_early", normal: "springer_runner_price_normal" },
    springerToilet: { early: "springer_toilet_price_early", normal: "springer_toilet_price_normal" },
    abbau: { early: "abbau_price_early", normal: "abbau_price_normal" },
    aufbau: { early: "aufbau_price_early", normal: "aufbau_price_normal" },
    awareness: { early: "awareness_price_early", normal: "awareness_price_normal" },
    schichtleitung: { early: "schichtleitung_price_early", normal: "schichtleitung_price_normal" },
  };

  const [earlyBirdEnabled, setEarlyBirdEnabled] = useState(initialSettings?.early_bird_enabled ?? false);
  const [earlyBirdCutoff, setEarlyBirdCutoff] = useState(
    initialSettings?.early_bird_cutoff ? new Date(initialSettings.early_bird_cutoff).toISOString().slice(0, 16) : ""
  );
  const [earlyBirdTotalLimit, setEarlyBirdTotalLimit] = useState(
    initialSettings?.early_bird_total_limit !== null && initialSettings?.early_bird_total_limit !== undefined
      ? initialSettings.early_bird_total_limit.toString()
      : ""
  );
  const [normalTotalLimit, setNormalTotalLimit] = useState(
    initialSettings?.normal_total_limit !== null && initialSettings?.normal_total_limit !== undefined
      ? initialSettings.normal_total_limit.toString()
      : ""
  );

  const [limitValues, setLimitValues] = useState<Record<RoleKey, string>>(() => {
    const initial: Record<RoleKey, string> = {
      bar: "",
      kuechenhilfe: "",
      springerRunner: "",
      springerToilet: "",
      abbau: "",
      aufbau: "",
      awareness: "",
      schichtleitung: "",
    };

    if (initialSettings) {
      (Object.keys(initial) as RoleKey[]).forEach((role) => {
        const field = limitFieldByRole[role];
        const value = initialSettings[field];
        initial[role] = value !== null && value !== undefined ? value.toString() : "";
      });
    }

    return initial;
  });

  const [priceValues, setPriceValues] = useState<Record<`${RoleKey}_early` | `${RoleKey}_normal`, string>>(() => {
    const initial: Record<`${RoleKey}_early` | `${RoleKey}_normal`, string> = {
      bar_early: "",
      bar_normal: "",
      kuechenhilfe_early: "",
      kuechenhilfe_normal: "",
      springerRunner_early: "",
      springerRunner_normal: "",
      springerToilet_early: "",
      springerToilet_normal: "",
      abbau_early: "",
      abbau_normal: "",
      aufbau_early: "",
      aufbau_normal: "",
      awareness_early: "",
      awareness_normal: "",
      schichtleitung_early: "",
      schichtleitung_normal: "",
    };

    if (initialSettings) {
      (Object.keys(priceFieldByRole) as RoleKey[]).forEach((role) => {
        const fields = priceFieldByRole[role];
        const earlyVal = initialSettings[fields.early];
        const normalVal = initialSettings[fields.normal];
        initial[`${role}_early`] = earlyVal !== null && earlyVal !== undefined ? earlyVal.toString() : "";
        initial[`${role}_normal`] = normalVal !== null && normalVal !== undefined ? normalVal.toString() : "";
      });
    }

    return initial;
  });

  // Sync form state when initialSettings changes (e.g., after loading)
  useEffect(() => {
    if (initialSettings) {
      setEarlyBirdEnabled(initialSettings.early_bird_enabled ?? false);
      setEarlyBirdCutoff(
        initialSettings.early_bird_cutoff 
          ? new Date(initialSettings.early_bird_cutoff).toISOString().slice(0, 16) 
          : ""
      );
      setEarlyBirdTotalLimit(
        initialSettings.early_bird_total_limit !== null && initialSettings.early_bird_total_limit !== undefined
          ? initialSettings.early_bird_total_limit.toString()
          : ""
      );
      setNormalTotalLimit(
        initialSettings.normal_total_limit !== null && initialSettings.normal_total_limit !== undefined
          ? initialSettings.normal_total_limit.toString()
          : ""
      );

      // Update limit values
      const newLimitValues: Record<RoleKey, string> = {
        bar: "",
        kuechenhilfe: "",
        springerRunner: "",
        springerToilet: "",
        abbau: "",
        aufbau: "",
        awareness: "",
        schichtleitung: "",
      };
      (Object.keys(newLimitValues) as RoleKey[]).forEach((role) => {
        const field = limitFieldByRole[role];
        const value = initialSettings[field];
        newLimitValues[role] = value !== null && value !== undefined ? value.toString() : "";
      });
      setLimitValues(newLimitValues);

      // Update price values
      const newPriceValues: Record<`${RoleKey}_early` | `${RoleKey}_normal`, string> = {
        bar_early: "",
        bar_normal: "",
        kuechenhilfe_early: "",
        kuechenhilfe_normal: "",
        springerRunner_early: "",
        springerRunner_normal: "",
        springerToilet_early: "",
        springerToilet_normal: "",
        abbau_early: "",
        abbau_normal: "",
        aufbau_early: "",
        aufbau_normal: "",
        awareness_early: "",
        awareness_normal: "",
        schichtleitung_early: "",
        schichtleitung_normal: "",
      };
      (Object.keys(priceFieldByRole) as RoleKey[]).forEach((role) => {
        const fields = priceFieldByRole[role];
        const earlyVal = initialSettings[fields.early];
        const normalVal = initialSettings[fields.normal];
        newPriceValues[`${role}_early`] = earlyVal !== null && earlyVal !== undefined ? earlyVal.toString() : "";
        newPriceValues[`${role}_normal`] = normalVal !== null && normalVal !== undefined ? normalVal.toString() : "";
      });
      setPriceValues(newPriceValues);
    }
  }, [initialSettings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settings: Partial<TicketSettings> = {
      early_bird_enabled: earlyBirdEnabled,
      early_bird_cutoff: earlyBirdCutoff ? new Date(earlyBirdCutoff).toISOString() : null,
      early_bird_total_limit: earlyBirdTotalLimit.trim() 
        ? (() => {
            const parsed = parseInt(earlyBirdTotalLimit.trim(), 10);
            return !isNaN(parsed) && parsed >= 0 ? parsed : null;
          })()
        : null,
      normal_total_limit: normalTotalLimit.trim() 
        ? (() => {
            const parsed = parseInt(normalTotalLimit.trim(), 10);
            return !isNaN(parsed) && parsed >= 0 ? parsed : null;
          })()
        : null,
    };

    // Limits - include all fields explicitly (even if null)
    (Object.keys(limitValues) as RoleKey[]).forEach((role) => {
      const field = limitFieldByRole[role];
      const raw = limitValues[role]?.trim() || "";
      
      if (raw === "") {
        // Empty string means unlimited (null)
        (settings as any)[field] = null;
      } else {
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          (settings as any)[field] = parsed;
        } else {
          // Invalid number, set to null to clear it
          console.warn(`[TicketSettingsForm] Invalid limit value for ${role}: "${raw}", setting to null`);
          (settings as any)[field] = null;
        }
      }
    });

    // Prices - include all fields explicitly (even if null)
    (Object.keys(priceFieldByRole) as RoleKey[]).forEach((role) => {
      const fields = priceFieldByRole[role];
      const early = priceValues[`${role}_early`]?.trim() || "";
      const normal = priceValues[`${role}_normal`]?.trim() || "";
      
      if (early === "") {
        (settings as any)[fields.early] = null;
      } else {
        const parsed = parseFloat(early);
        if (!isNaN(parsed) && parsed >= 0) {
          (settings as any)[fields.early] = parsed;
        } else {
          console.warn(`[TicketSettingsForm] Invalid early price for ${role}: "${early}", setting to null`);
          (settings as any)[fields.early] = null;
        }
      }
      
      if (normal === "") {
        (settings as any)[fields.normal] = null;
      } else {
        const parsed = parseFloat(normal);
        if (!isNaN(parsed) && parsed >= 0) {
          (settings as any)[fields.normal] = parsed;
        } else {
          console.warn(`[TicketSettingsForm] Invalid normal price for ${role}: "${normal}", setting to null`);
          (settings as any)[fields.normal] = null;
        }
      }
    });

    // Log the aufbau limit specifically for debugging
    console.log('[TicketSettingsForm] Submitting settings:', {
      aufbau_limit: settings.aufbau_limit,
      aufbau_limit_raw: limitValues.aufbau,
      allLimits: Object.entries(limitValues).reduce((acc, [role, value]) => {
        acc[role] = { raw: value, parsed: (settings as any)[limitFieldByRole[role as RoleKey]] };
        return acc;
      }, {} as Record<string, { raw: string; parsed: any }>),
    });

    onSave(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Universal Ticket Limits - Prominent Section */}
      <div className="space-y-4 p-6 border-2 rounded-lg bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-bold">{t("universalTicketLimits")}</h3>
          <Info className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t("universalTicketLimitsDesc")}
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Early-Bird Universal Limit */}
          <div className="space-y-2 p-4 bg-background rounded-lg border">
            <Label htmlFor="early_bird_total_limit" className="text-base font-semibold">
              {t("earlyBirdTotalLimit")}
            </Label>
            <Input
              id="early_bird_total_limit"
              type="number"
              min="0"
              value={earlyBirdTotalLimit}
              onChange={(e) => setEarlyBirdTotalLimit(e.target.value)}
              placeholder={t("unlimited")}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              {t("earlyBirdTotalLimitDesc")}
            </p>
          </div>

          {/* Normal Bird Universal Limit */}
          <div className="space-y-2 p-4 bg-background rounded-lg border">
            <Label htmlFor="normal_total_limit" className="text-base font-semibold">
              {t("normalTotalLimit")}
            </Label>
            <Input
              id="normal_total_limit"
              type="number"
              min="0"
              value={normalTotalLimit}
              onChange={(e) => setNormalTotalLimit(e.target.value)}
              placeholder={t("unlimited")}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              {t("normalTotalLimitDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Early Bird Settings */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">{t("earlyBirdTicketSettings")}</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="early_bird_enabled">{t("enableEarlyBirdTickets")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("enableEarlyBirdTicketsDesc")}
            </p>
          </div>
          <Switch
            id="early_bird_enabled"
            checked={earlyBirdEnabled}
            onCheckedChange={setEarlyBirdEnabled}
          />
        </div>

        {earlyBirdEnabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="early_bird_cutoff">{t("earlyBirdCutoffDate")}</Label>
              <Input
                id="early_bird_cutoff"
                type="datetime-local"
                value={earlyBirdCutoff}
                onChange={(e) => setEarlyBirdCutoff(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("earlyBirdCutoffDesc")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Limits */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">{t("ticketAvailabilityLimits")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("setMaximumTickets")}
        </p>
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold">{t("standardTickets_plural")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {standardRoles.map((role) => (
                <div key={role.key} className="space-y-2">
                  <Label htmlFor={`${role.key}_limit`}>{role.label} {t("limit")}</Label>
                  <Input
                    id={`${role.key}_limit`}
                    type="number"
                    min="0"
                    value={limitValues[role.key]}
                    onChange={(e) =>
                      setLimitValues((prev) => ({ ...prev, [role.key]: e.target.value }))
                    }
                    placeholder={t("unlimited")}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">{t("reducedTickets_plural")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reducedRoles.map((role) => (
                <div key={role.key} className="space-y-2">
                  <Label htmlFor={`${role.key}_limit`}>{role.label} {t("limit")}</Label>
                  <Input
                    id={`${role.key}_limit`}
                    type="number"
                    min="0"
                    value={limitValues[role.key]}
                    onChange={(e) =>
                      setLimitValues((prev) => ({ ...prev, [role.key]: e.target.value }))
                    }
                    placeholder={t("unlimited")}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Settings */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">{t("ticketPricing")}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t("setPricesForRoles")}
        </p>

        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold">{t("standardTickets_plural")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {standardRoles.map((role) => (
                <div key={role.key} className="space-y-3 p-3 rounded-lg border">
                  <div className="font-medium">{role.label}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${role.key}_price_early`}>{t("earlyBirdPrice")}</Label>
                      <Input
                        id={`${role.key}_price_early`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceValues[`${role.key}_early`]}
                        onChange={(e) =>
                          setPriceValues((prev) => ({ ...prev, [`${role.key}_early`]: e.target.value }))
                        }
                        placeholder="100.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${role.key}_price_normal`}>{t("normalPrice")}</Label>
                      <Input
                        id={`${role.key}_price_normal`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceValues[`${role.key}_normal`]}
                        onChange={(e) =>
                          setPriceValues((prev) => ({ ...prev, [`${role.key}_normal`]: e.target.value }))
                        }
                        placeholder="120.00"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">{t("reducedTickets_plural")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reducedRoles.map((role) => (
                <div key={role.key} className="space-y-3 p-3 rounded-lg border">
                  <div className="font-medium">{role.label}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${role.key}_price_early`}>{t("earlyBirdPrice")}</Label>
                      <Input
                        id={`${role.key}_price_early`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceValues[`${role.key}_early`]}
                        onChange={(e) =>
                          setPriceValues((prev) => ({ ...prev, [`${role.key}_early`]: e.target.value }))
                        }
                        placeholder="100.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${role.key}_price_normal`}>{t("normalPrice")}</Label>
                      <Input
                        id={`${role.key}_price_normal`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceValues[`${role.key}_normal`]}
                        onChange={(e) =>
                          setPriceValues((prev) => ({ ...prev, [`${role.key}_normal`]: e.target.value }))
                        }
                        placeholder="120.00"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {t("saveTicketSettings")}
      </Button>
    </form>
  );
};

interface AboutPageFormProps {
  onSaveContent: (content: Partial<AboutPageContentType>) => void;
  initialContent?: AboutPageContentType | null;
  photos: AboutPagePhoto[];
  onPhotosChange: () => void;
}

const AboutPageForm = ({ onSaveContent, initialContent, photos, onPhotosChange }: AboutPageFormProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [contentTitle, setContentTitle] = useState(initialContent?.title || '');
  const [contentText, setContentText] = useState(initialContent?.content || '');
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<AboutPagePhoto | null>(null);

  // Sync form state when initialContent updates after save
  useEffect(() => {
    setContentTitle(initialContent?.title || '');
    setContentText(initialContent?.content || '');
  }, [initialContent]);

  const handleContentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveContent({
      title: contentTitle,
      content: contentText,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
          title: t("error"),
          description: "Please upload an image file",
          variant: "destructive",
        });
      return;
    }

    setUploading(true);
    try {
      const maxOrderIndex = photos.length > 0 ? Math.max(...photos.map(p => p.order_index)) : -1;
      await uploadAboutPagePhoto(
        file,
        'center',
        'medium',
        null,
        maxOrderIndex + 1
      );

      toast({ title: t("photoUploadedSuccessfully") });
      onPhotosChange();
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("failedToUploadPhoto"),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleUpdatePhoto = async (photo: AboutPagePhoto, updates: Partial<AboutPagePhoto>) => {
    try {
      await updateAboutPagePhoto(photo.id, updates);
      toast({ title: t("photoUpdatedSuccessfully") });
      onPhotosChange();
      setEditingPhoto(null);
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("failedToUpdatePhoto"),
        variant: "destructive",
      });
    }
  };

  const handleDeletePhoto = async (photo: AboutPagePhoto) => {
    if (!confirm(t("areYouSureDeletePhoto"))) return;

    try {
      await deleteAboutPagePhoto(photo.id, photo.image_path);
      toast({ title: t("photoDeletedSuccessfully") });
      onPhotosChange();
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error?.message || t("failedToDeletePhoto"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Content Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t("pageContent")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleContentSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="about_title">{t("title")}</Label>
              <Input
                id="about_title"
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
                placeholder="About Us"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="about_content">{t("content")}</Label>
              <Textarea
                id="about_content"
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                rows={8}
                placeholder="Enter the about page content..."
              />
            </div>
            <Button type="submit">{t("saveContent")}</Button>
          </form>
        </CardContent>
      </Card>

      {/* Photo Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t("festivalPhotos")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="photo_upload">{t("uploadNewPhoto")}</Label>
            <div className="flex items-center gap-4">
              <Input
                id="photo_upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="cursor-pointer"
              />
              {uploading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </div>
          </div>

          {/* Photos List */}
          <div className="space-y-4">
            {photos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t("noPhotosUploaded")}</p>
            ) : (
              photos.map((photo) => (
                <Card key={photo.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={photo.image_url}
                        alt={photo.caption || "Festival photo"}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1 space-y-3">
                        {editingPhoto?.id === photo.id ? (
                          <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>{t("alignment")}</Label>
                                  <Select
                                    value={editingPhoto.alignment}
                                    onValueChange={(value: 'left' | 'center' | 'right') =>
                                      setEditingPhoto({ ...editingPhoto, alignment: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="left">{t("left")}</SelectItem>
                                      <SelectItem value="center">{t("center")}</SelectItem>
                                      <SelectItem value="right">{t("right")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>{t("size")}</Label>
                                  <Select
                                    value={editingPhoto.size}
                                    onValueChange={(value: 'small' | 'medium' | 'large' | 'full') =>
                                      setEditingPhoto({ ...editingPhoto, size: value })
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="small">{t("small")}</SelectItem>
                                      <SelectItem value="medium">{t("medium")}</SelectItem>
                                      <SelectItem value="large">{t("large")}</SelectItem>
                                      <SelectItem value="full">{t("fullWidth")}</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>{t("caption")}</Label>
                                <Input
                                  value={editingPhoto.caption || ''}
                                  onChange={(e) =>
                                    setEditingPhoto({ ...editingPhoto, caption: e.target.value })
                                  }
                                  placeholder={t("optionalCaption")}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (editingPhoto) {
                                      handleUpdatePhoto(photo, editingPhoto);
                                    }
                                  }}
                                >
                                  {t("save")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPhoto(null)}
                                >
                                  {t("cancel")}
                                </Button>
                              </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">Alignment: {photo.alignment}</p>
                                <p className="text-sm text-muted-foreground">Size: {photo.size}</p>
                                {photo.caption && (
                                  <p className="text-sm mt-1">{photo.caption}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPhoto(photo)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeletePhoto(photo)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;