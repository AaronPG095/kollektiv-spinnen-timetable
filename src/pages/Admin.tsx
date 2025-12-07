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
import { Loader2, Plus, Edit, Trash2, LogOut, Search, Eye, EyeOff, HelpCircle, ArrowUpDown, Calendar } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { FestivalHeader } from '@/components/FestivalHeader';

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
  const [showHiddenMode, setShowHiddenMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "faqs">("events");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (!authLoading && user && !isAdmin) {
      navigate('/');
      toast({
        title: t("accessDenied"),
        description: t("noAdminPermissions"),
        variant: "destructive",
      });
      return;
    }

    if (isAdmin) {
      loadEvents();
      loadFAQs();
    }
  }, [user, isAdmin, authLoading, navigate]);

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
        title: "Error",
        description: error?.message || "Failed to load events. Please check your connection and try again.",
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
        title: "Error",
        description: error?.message || "Failed to load FAQs. Please check your connection and try again.",
        variant: "destructive",
      });
      setFaqs([]);
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
        toast({ title: "Event updated successfully" });
      } else {
        console.log('[Admin] Creating new event');
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        
        if (error) {
          console.error('[Admin] Error creating event:', error);
          throw error;
        }
        toast({ title: "Event created successfully" });
      }
      
      loadEvents();
      setEditingEvent(null);
      setIsCreateOpen(false);
    } catch (error: any) {
      console.error('[Admin] Error saving event:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save event. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
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
      toast({ title: "Event deleted successfully" });
      loadEvents();
    } catch (error: any) {
      console.error('[Admin] Error deleting event:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete event. Please check your connection and try again.",
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
        title: currentVisibility ? "Event hidden from public" : "Event made visible to public" 
      });
      loadEvents();
    } catch (error: any) {
      console.error('[Admin] Error toggling event visibility:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update event visibility. Please check your connection and try again.",
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
        toast({ title: "FAQ updated successfully" });
      } else {
        console.log('[Admin] Creating new FAQ');
        const { error } = await supabase
          .from('faqs')
          .insert([faqData]);
        
        if (error) {
          console.error('[Admin] Error creating FAQ:', error);
          throw error;
        }
        toast({ title: "FAQ created successfully" });
      }
      
      loadFAQs();
      setEditingFAQ(null);
      setIsFAQCreateOpen(false);
    } catch (error: any) {
      console.error('[Admin] Error saving FAQ:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save FAQ. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    
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
      toast({ title: "FAQ deleted successfully" });
      loadFAQs();
    } catch (error: any) {
      console.error('[Admin] Error deleting FAQ:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to delete FAQ. Please check your connection and try again.",
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
        title: currentVisibility ? "FAQ hidden from public" : "FAQ made visible to public" 
      });
      loadFAQs();
    } catch (error: any) {
      console.error('[Admin] Error toggling FAQ visibility:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update FAQ visibility. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Filter events based on search query
  const filteredEvents = events.filter(event => {
    const query = searchQuery.toLowerCase();
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <FestivalHeader />
      <div className="flex-1 p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-4">
              {/* Tab Navigation */}
              <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
                <Button
                  variant={activeTab === "events" ? "default" : "ghost"}
                  onClick={() => setActiveTab("events")}
                  className="gap-2 text-sm py-2 px-3"
                  size="sm"
                >
                  <Calendar className="h-3 w-3" />
                  Events
                </Button>
                <Button
                  variant={activeTab === "faqs" ? "default" : "ghost"}
                  onClick={() => setActiveTab("faqs")}
                  className="gap-2 text-sm py-2 px-3"
                  size="sm"
                >
                  <HelpCircle className="h-3 w-3" />
                  FAQs
                </Button>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => navigate('/')} variant="outline">
                  Back to Festival
                </Button>
                <Button onClick={handleSignOut} variant="outline">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {activeTab === "events" ? "Events Management" : "FAQ Management"}
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
                      Hidden Mode
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show All
                    </>
                  )}
                </Button>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="min-h-[44px]">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] mx-4 sm:mx-auto overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Event</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[75vh] overflow-y-auto pr-2">
                      <EventForm onSave={handleSaveEvent} />
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <Dialog open={isFAQCreateOpen} onOpenChange={setIsFAQCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="min-h-[44px]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add FAQ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] mx-4 sm:mx-auto overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New FAQ</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[75vh] overflow-y-auto pr-2">
                    <FAQForm onSave={handleSaveFAQ} />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events by title, venue, day, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-3">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          )}
        </div>

        {activeTab === "events" ? (
          <div className="w-full">
            {sortedDays.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>No events found</p>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {sortedDays.map((day) => (
                  <div key={day} className="flex-shrink-0 w-[calc(50%-12px)] min-w-[400px] space-y-4">
                    {/* Day Header */}
                    <div className="flex items-center gap-3 pb-2 border-b border-border">
                      <h3 className="text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {day}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        ({eventsByDay[day].length} {eventsByDay[day].length === 1 ? 'event' : 'events'})
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
                                      Hidden
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
                                  title={event.is_visible === false ? "Make visible to public" : "Hide from public"}
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
                                      <DialogTitle>Edit Event</DialogTitle>
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
        ) : (
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
                        ({categoryFAQs.length} {categoryFAQs.length === 1 ? 'FAQ' : 'FAQs'})
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
                              ({subcategoryFAQs.length} {subcategoryFAQs.length === 1 ? 'FAQ' : 'FAQs'})
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
                                          Hidden
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
                                      title={germanFAQ.is_visible === false ? "Make visible to public" : "Hide from public"}
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
                                          <DialogTitle>Edit FAQ</DialogTitle>
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
                                          Hidden
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
                                      title={englishFAQ.is_visible === false ? "Make visible to public" : "Hide from public"}
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
                                          <DialogTitle>Edit FAQ</DialogTitle>
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
        )}
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
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time *</Label>
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
          <Label htmlFor="start_time">Start Time</Label>
          <Input
            id="start_time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            placeholder="19:00"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
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
          <Label htmlFor="day">Day *</Label>
          <Select 
            value={formData.day} 
            onValueChange={(value) => setFormData({ ...formData, day: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Freitag">Freitag</SelectItem>
              <SelectItem value="Samstag">Samstag</SelectItem>
              <SelectItem value="Sonntag">Sonntag</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="venue">Venue *</Label>
          <Select 
            value={formData.venue} 
            onValueChange={(value) => setFormData({ ...formData, venue: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draussen">draussen</SelectItem>
              <SelectItem value="oben">oben</SelectItem>
              <SelectItem value="unten">unten</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select 
            value={formData.type} 
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="live">live</SelectItem>
              <SelectItem value="dj">dj</SelectItem>
              <SelectItem value="performance">performance</SelectItem>
              <SelectItem value="workshop">workshop</SelectItem>
              <SelectItem value="interaktiv">interaktiv</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description_de">Description (German)</Label>
          <Textarea
            id="description_de"
            value={formData.description_de}
            onChange={(e) => setFormData({ ...formData, description_de: e.target.value })}
            rows={3}
            placeholder="German description..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description_en">Description (English)</Label>
          <Textarea
            id="description_en"
            value={formData.description_en}
            onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            rows={3}
            placeholder="English description..."
          />
        </div>
      </div>

      {/* Links Management */}
      <div className="space-y-4">
        <Label className="text-lg font-semibold">Links</Label>
        
        {/* Existing Links */}
        {linksArray.length > 0 && (
          <div className="space-y-3">
            {linksArray.map((link) => (
              <div key={link.id} className="flex gap-2 items-center p-3 border rounded-md bg-muted/50">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input
                    placeholder="Platform (e.g., Instagram, Spotify)"
                    value={link.platform}
                    onChange={(e) => updateLink(link.id, 'platform', e.target.value)}
                  />
                  <Input
                    placeholder="URL"
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
              placeholder="Platform (e.g., Instagram, Spotify)"
              value={newLink.platform}
              onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
            />
            <Input
              placeholder="URL"
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
            Add Link
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full">
        {initialEvent ? 'Update Event' : 'Create Event'}
      </Button>
    </form>
  );
};

interface FAQFormProps {
  onSave: (faq: Omit<FAQItem, 'id'>) => void;
  initialFAQ?: FAQItem;
}

const FAQForm = ({ onSave, initialFAQ }: FAQFormProps) => {
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
        <Label htmlFor="question">Question *</Label>
        <Input
          id="question"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          required
          placeholder="Enter the frequently asked question..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Answer *</Label>
        <Textarea
          id="answer"
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          required
          rows={4}
          placeholder="Enter the answer to the question..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="order_index">Display Order</Label>
        <Input
          id="order_index"
          type="number"
          value={formData.order_index}
          onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
          placeholder="0"
          min="0"
        />
        <p className="text-xs text-muted-foreground">
          Lower numbers appear first. Use this to control the order of FAQs.
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
        <Label htmlFor="is_visible">Visible to public</Label>
      </div>

      <Button type="submit" className="w-full">
        {initialFAQ ? 'Update FAQ' : 'Create FAQ'}
      </Button>
    </form>
  );
};

export default Admin;