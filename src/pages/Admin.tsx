import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, X as XIcon } from 'lucide-react';
import { getTicketSettings, updateTicketSettings, type TicketSettings } from '@/lib/ticketSettings';
import { getAllPurchases, type TicketPurchase, createTicketPurchaseAdmin, updateTicketPurchaseAdmin } from '@/lib/ticketPurchases';
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
import { Loader2, Plus, Edit, Trash2, LogOut, Search, Eye, EyeOff, HelpCircle, ArrowUpDown, Calendar, Ticket, Info, Check, X, XCircle, Users as UsersIcon, Shield, ShieldOff, Copy } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { FestivalHeader } from '@/components/FestivalHeader';
import { useDebounce } from '@/hooks/useDebounce';
import { isValidUrl, sanitizeUrl } from '@/lib/validation';
import { logError, formatSupabaseError } from '@/lib/errorHandler';
import { getCurrentYear } from '@/lib/yearEvents';

interface DatabaseEvent {
  id: string;
  title: string;
  time: string | null; // Auto-generated from start_time and end_time
  start_time: string; // Required
  end_time: string; // Required
  venue: string;
  day: string;
  type: string;
  description: string | null;
  links: any;
  is_visible?: boolean;
  years: number[];
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

interface UserWithAdminStatus {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const Admin = () => {
  const { user, isAdmin, isSuperAdmin, signOut, loading: authLoading, resetPasswordForEmail } = useAuth();
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
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [faqFilterCategory, setFaqFilterCategory] = useState<string>("all");
  const [faqFilterLanguage, setFaqFilterLanguage] = useState<string>("all");
  const [faqFilterVisibility, setFaqFilterVisibility] = useState<string>("all");
  const [showHiddenMode, setShowHiddenMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | "all">(getCurrentYear());
  const [activeTab, setActiveTab] = useState<"events" | "faqs" | "tickets" | "about" | "users">("events");
  const [ticketSettings, setTicketSettings] = useState<TicketSettings | null>(null);
  const [ticketSettingsLoading, setTicketSettingsLoading] = useState(false);
  const [ticketPurchases, setTicketPurchases] = useState<TicketPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [ticketSubTab, setTicketSubTab] = useState<"settings" | "purchases" | "checked" | "cancelled">("settings");
  const [notes, setNotes] = useState<string>("");
  const [notesSaving, setNotesSaving] = useState(false);
  const lastSavedNotesRef = useRef<string>("");
  const [aboutPageContent, setAboutPageContent] = useState<AboutPageContentType | null>(null);
  const [aboutPagePhotos, setAboutPagePhotos] = useState<AboutPagePhoto[]>([]);
  const [aboutPageLoading, setAboutPageLoading] = useState(false);
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");
  const [checkedSearchQuery, setCheckedSearchQuery] = useState("");
  const [cancelledSearchQuery, setCancelledSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  
  // Soli-Contribution Add/Edit State
  const [isCreatePurchaseOpen, setIsCreatePurchaseOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<TicketPurchase | null>(null);
  
  // User Management State
  const [users, setUsers] = useState<UserWithAdminStatus[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [removeAdminDialogOpen, setRemoveAdminDialogOpen] = useState(false);
  const [userToModify, setUserToModify] = useState<UserWithAdminStatus | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<UserWithAdminStatus | null>(null);
  
  // Event Duplication State
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [eventToDuplicate, setEventToDuplicate] = useState<DatabaseEvent | null>(null);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear() + 1);

  // Derived collections for ticket views
  // "Pending Soli-Contributions" tab shows: confirmed but unchecked purchases
  const uncheckedPurchases = ticketPurchases.filter(
    (p) => p.status === 'confirmed' && !p.checked
  );
  const checkedConfirmedPurchases = ticketPurchases.filter(
    (p) => p.status === 'confirmed' && p.checked
  );
  const cancelledPurchases = ticketPurchases.filter(
    (p) => p.status === 'cancelled'
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

  const filteredPendingPurchases = filterPurchasesBySearch(uncheckedPurchases, pendingSearchQuery);
  const filteredCheckedPurchases = filterPurchasesBySearch(checkedConfirmedPurchases, checkedSearchQuery);
  const filteredCancelledPurchases = filterPurchasesBySearch(cancelledPurchases, cancelledSearchQuery);

  // Load events when selectedYear changes
  useEffect(() => {
    if (isAdmin && activeTab === "events") {
      loadEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, isAdmin, activeTab]);

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
            errors.forEach(({ name, error }) => {
              logError('Admin', error, { operation: 'loadDataSources', dataSource: name });
            });
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

  // Load users when users tab is active
  useEffect(() => {
    if (isAdmin && activeTab === "users" && !usersLoading) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab]);

  const loadEvents = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Admin] Loading all events (admin view)...');
      }
      
      // Import year utilities
      const { queryAllYearlyEvents, queryYearlyEvents, getAvailableYears } = await import('@/lib/yearEvents');
      
      let allEventsData: (DatabaseEvent & { year: number })[] = [];
      
      if (selectedYear === "all") {
        // Load events from all yearly tables
        const eventsWithYears = await queryAllYearlyEvents(true); // includeHidden = true for admin
        allEventsData = eventsWithYears.map(event => ({
          ...event,
          year: (event as any).year,
          years: [(event as any).year] // Convert to array format for compatibility
        })) as (DatabaseEvent & { year: number })[];
      } else {
        // Load events from specific year's table
        const yearEvents = await queryYearlyEvents(selectedYear, true); // includeHidden = true for admin
        allEventsData = yearEvents.map(event => ({
          ...event,
          year: selectedYear,
          years: [selectedYear]
        })) as (DatabaseEvent & { year: number })[];
      }
      
      if (import.meta.env.DEV) {
        console.log(`[Admin] Successfully loaded ${allEventsData.length} events`);
      }
      
      // Normalize years field to ensure it's always an array
      const normalizedEvents: DatabaseEvent[] = allEventsData.map(event => ({
        ...event,
        years: Array.isArray(event.years) && event.years.length > 0
          ? event.years.filter(y => typeof y === 'number' && y > 2000 && y < 2100)
          : [event.year || new Date().getFullYear()]
      }));
      
      setEvents(normalizedEvents);
    } catch (error: any) {
      logError('Admin', error, { operation: 'loadEvents' });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToLoadEvents"),
        variant: "destructive",
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    try {
      if (import.meta.env.DEV) {
        console.log('[Admin] Loading all FAQs (admin view)...');
      }
      
      // Admin should see all FAQs including hidden ones
      // RLS policies should allow admins to see everything
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        logError('Admin', error, { operation: 'loadFAQs' });
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log(`[Admin] Successfully loaded ${data?.length || 0} FAQs`);
      }
      setFaqs(data || []);
    } catch (error: any) {
      logError('Admin', error, { operation: 'loadFAQs' });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToLoadFAQs"),
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
      // Sync notes when settings load and initialize the ref
      // Handle both null and undefined cases
      const notesValue = settings.notes ?? "";
      setNotes(notesValue);
      lastSavedNotesRef.current = notesValue;
      console.log('[Admin] Loaded ticket settings, notes:', notesValue || '(empty)');
    } catch (error: any) {
      logError('Admin', error, { operation: 'loadTicketSettings' });
        toast({
          title: t("error"),
          description: formatSupabaseError(error) || t("failedToLoadTicketSettings"),
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
      logError('Admin', error, { operation: 'loadTicketPurchases' });
        toast({
          title: t("error"),
          description: formatSupabaseError(error) || t("failedToLoadTicketPurchases"),
          variant: "destructive",
        });
    } finally {
      setPurchasesLoading(false);
    }
  };

  const handleCancelPurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('soli_contribution_purchases')
        .update({ status: 'cancelled' })
        .eq('id', purchaseId);

      if (error) {
        logError('Admin', error, { operation: 'cancelPurchase', purchaseId });
        toast({
          title: t("error"),
          description: formatSupabaseError(error) || t("failedToCancelPurchase"),
          variant: "destructive",
        });
      } else {
        // Update local state optimistically
        setTicketPurchases(prev =>
          prev.map(p =>
            p.id === purchaseId ? { ...p, status: 'cancelled' as const } : p
          )
        );
        toast({
          title: t("success"),
          description: t("purchaseCancelledSuccessfully"),
        });
      }
    } catch (err: any) {
      logError('Admin', err, { operation: 'cancelPurchase', purchaseId });
      toast({
        title: t("error"),
        description: formatSupabaseError(err) || t("failedToCancelPurchase"),
        variant: "destructive",
      });
    }
  };

  const handleReactivatePurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('soli_contribution_purchases')
        .update({ status: 'confirmed' })
        .eq('id', purchaseId);

      if (error) {
        logError('Admin', error, { operation: 'reactivatePurchase', purchaseId });
        toast({
          title: t("error"),
          description: formatSupabaseError(error) || t("failedToReactivatePurchase"),
          variant: "destructive",
        });
      } else {
        // Update local state optimistically
        setTicketPurchases(prev =>
          prev.map(p =>
            p.id === purchaseId ? { ...p, status: 'confirmed' as const } : p
          )
        );
        toast({
          title: t("success"),
          description: t("purchaseReactivatedSuccessfully"),
        });
      }
    } catch (err: any) {
      logError('Admin', err, { operation: 'reactivatePurchase', purchaseId });
      toast({
        title: t("error"),
        description: formatSupabaseError(err) || t("failedToReactivatePurchase"),
        variant: "destructive",
      });
    }
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    try {
      const { error } = await supabase
        .from('soli_contribution_purchases')
        .delete()
        .eq('id', purchaseId);

      if (error) {
        logError('Admin', error, { operation: 'deletePurchase', purchaseId });
        toast({
          title: t("error"),
          description: formatSupabaseError(error) || t("failedToDeletePurchase"),
          variant: "destructive",
        });
      } else {
        // Remove from local state
        setTicketPurchases(prev => prev.filter(p => p.id !== purchaseId));
        toast({
          title: t("success"),
          description: t("purchaseDeletedSuccessfully"),
        });
      }
      setDeleteDialogOpen(false);
      setPurchaseToDelete(null);
    } catch (err: any) {
      logError('Admin', err, { operation: 'deletePurchase', purchaseId: purchaseToDelete });
      toast({
        title: t("error"),
        description: formatSupabaseError(err) || t("failedToDeletePurchase"),
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setPurchaseToDelete(null);
    }
  };

  const openDeleteDialog = (purchaseId: string) => {
    setPurchaseToDelete(purchaseId);
    setDeleteDialogOpen(true);
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
        logError('Admin', new Error(result.error || 'Unknown error'), { operation: 'saveTicketSettings' });
        // Show the specific error message from the database
        toast({
          title: t("error"),
          description: result.error || t("failedToSaveTicketSettings"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      logError('Admin', error, { operation: 'saveTicketSettings' });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToSaveTicketSettings"),
        variant: "destructive",
      });
    }
  };

  const handleSaveNotes = async (notesToSave: string) => {
    try {
      setNotesSaving(true);
      console.log('[Admin] Saving notes:', notesToSave || '(empty)');
      const result = await updateTicketSettings({ notes: notesToSave || null });
      if (result.success) {
        // Update the ref to track what we just saved
        lastSavedNotesRef.current = notesToSave;
        // Update local state without showing toast (autosave is silent)
        if (ticketSettings) {
          setTicketSettings({ ...ticketSettings, notes: notesToSave || null });
        }
        console.log('[Admin] Notes saved successfully');
      } else {
        console.error('[Admin] Failed to save notes:', result.error);
        logError('Admin', new Error(result.error || 'Unknown error'), { operation: 'saveNotes' });
      }
    } catch (error: any) {
      console.error('[Admin] Error saving notes:', error);
      logError('Admin', error, { operation: 'saveNotes' });
    } finally {
      setNotesSaving(false);
    }
  };

  // Autosave notes with debounce
  const debouncedNotes = useDebounce(notes, 1000);
  
  useEffect(() => {
    // Only save if notes have changed and we're on the tickets settings tab
    if (activeTab === "tickets" && ticketSubTab === "settings") {
      // Compare with the last saved value to avoid unnecessary saves
      if (debouncedNotes !== lastSavedNotesRef.current) {
        handleSaveNotes(debouncedNotes);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes, activeTab, ticketSubTab]);

  // Sync notes when ticketSettings changes (but only if user hasn't made local changes)
  useEffect(() => {
    if (ticketSettings) {
      const currentNotes = ticketSettings.notes || "";
      // Only sync if notes haven't been modified locally
      // This prevents overwriting user input while typing
      if (notes === lastSavedNotesRef.current) {
        setNotes(currentNotes);
        lastSavedNotesRef.current = currentNotes;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketSettings]);

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
        description: formatSupabaseError(error) || t("failedToLoadAboutPageData"),
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
      logError('Admin', error, { operation: 'saveAboutPageContent' });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToSaveAboutPageContent"),
        variant: "destructive",
      });
    }
  };

  const handleSaveEvent = async (eventData: Omit<DatabaseEvent, 'id'>) => {
    try {
      const { getEventsTableName, getCurrentYear } = await import('@/lib/yearEvents');
      
      // Determine which year's table to use
      // Events now belong to a single year (first year in years array, or current year as default)
      const eventYear = Array.isArray(eventData.years) && eventData.years.length > 0
        ? eventData.years[0]
        : getCurrentYear();
      
      const tableName = getEventsTableName(eventYear);
      
      // Remove years field from data (not stored in yearly tables)
      const { years, ...dataToSave } = eventData;
      
      // Ensure time field is constructed from start_time and end_time if missing
      if (!dataToSave.time && dataToSave.start_time && dataToSave.end_time) {
        dataToSave.time = `${dataToSave.start_time} - ${dataToSave.end_time}`;
      }
      
      if (editingEvent) {
        if (import.meta.env.DEV) {
          console.log('[Admin] Updating event:', editingEvent.id, 'in table:', tableName);
        }
        const { error } = await supabase
          .from(tableName)
          .update(dataToSave)
          .eq('id', editingEvent.id);
        
        if (error) {
          logError('Admin', error, { operation: 'updateEvent', eventId: editingEvent.id, tableName });
          throw error;
        }
        toast({ title: t("eventUpdatedSuccessfully") });
      } else {
        if (import.meta.env.DEV) {
          console.log('[Admin] Creating new event in table:', tableName);
        }
        const { error } = await supabase
          .from(tableName)
          .insert([dataToSave]);
        
        if (error) {
          logError('Admin', error, { operation: 'createEvent', tableName });
          throw error;
        }
        toast({ title: t("eventCreatedSuccessfully") });
      }
      
      loadEvents();
      setEditingEvent(null);
      setIsCreateOpen(false);
    } catch (error: any) {
      logError('Admin', error, { operation: 'saveEvent' });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToSaveEvent"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: string, eventYear?: number) => {
    if (!confirm(t("areYouSureDeleteEvent"))) return;
    
    try {
      const { getEventsTableName, getCurrentYear } = await import('@/lib/yearEvents');
      
      // Determine which year's table to delete from
      // If eventYear is provided, use it; otherwise try to find the event first
      let yearToDelete = eventYear;
      
      if (!yearToDelete) {
        // Find the event to determine its year
        const eventToDelete = events.find(e => e.id === id);
        if (eventToDelete && Array.isArray(eventToDelete.years) && eventToDelete.years.length > 0) {
          yearToDelete = eventToDelete.years[0];
        } else {
          yearToDelete = getCurrentYear();
        }
      }
      
      const tableName = getEventsTableName(yearToDelete);
      
      if (import.meta.env.DEV) {
        console.log('[Admin] Deleting event:', id, 'from table:', tableName);
      }
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);
      
      if (error) {
        logError('Admin', error, { operation: 'deleteEvent', eventId: id, tableName });
        throw error;
      }
      toast({ title: t("eventDeletedSuccessfully") });
      loadEvents();
    } catch (error: any) {
      logError('Admin', error, { operation: 'deleteEvent', eventId: id });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToDeleteEvent"),
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean, eventYear?: number) => {
    try {
      const { getEventsTableName, getCurrentYear } = await import('@/lib/yearEvents');
      
      // Determine which year's table to update
      let yearToUpdate = eventYear;
      
      if (!yearToUpdate) {
        // Find the event to determine its year
        const eventToUpdate = events.find(e => e.id === id);
        if (eventToUpdate && Array.isArray(eventToUpdate.years) && eventToUpdate.years.length > 0) {
          yearToUpdate = eventToUpdate.years[0];
        } else {
          yearToUpdate = getCurrentYear();
        }
      }
      
      const tableName = getEventsTableName(yearToUpdate);
      
      if (import.meta.env.DEV) {
        console.log('[Admin] Toggling event visibility:', id, !currentVisibility, 'in table:', tableName);
      }
      
      const { error } = await supabase
        .from(tableName)
        .update({ is_visible: !currentVisibility })
        .eq('id', id);
      
      if (error) {
        logError('Admin', error, { operation: 'toggleEventVisibility', eventId: id, tableName });
        throw error;
      }
      toast({
        title: currentVisibility ? t("eventHiddenFromPublic") : t("eventMadeVisibleToPublic") 
      });
      loadEvents();
    } catch (error: any) {
      logError('Admin', error, { operation: 'toggleEventVisibility', eventId: id });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToUpdateEventVisibility"),
        variant: "destructive",
      });
    }
  };

  const handleToggleYearVisibility = async (year: number, visible: boolean) => {
    const confirmMessage = visible 
      ? `Are you sure you want to show all events for ${year}?`
      : `Are you sure you want to hide all events for ${year}?`;
    
    if (!confirm(confirmMessage)) return;
    
    try {
      const { getEventsTableName } = await import('@/lib/yearEvents');
      const tableName = getEventsTableName(year);
      
      if (import.meta.env.DEV) {
        console.log('[Admin] Toggling year visibility:', year, visible, 'in table:', tableName);
      }
      
      // Update all events in the yearly table
      // Supabase requires a WHERE clause for safety
      // We use .gte('created_at', '1970-01-01') which matches all rows since all timestamps are after 1970
      const { error } = await supabase
        .from(tableName)
        .update({ is_visible: visible })
        .gte('created_at', '1970-01-01');
      
      if (error) {
        logError('Admin', error, { operation: 'toggleYearVisibility', year, tableName });
        throw error;
      }
      toast({
        title: visible ? `All events for ${year} are now visible` : `All events for ${year} are now hidden`,
      });
      loadEvents();
    } catch (error: any) {
      logError('Admin', error, { operation: 'toggleYearVisibility', year });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || "Failed to update year visibility",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateEvent = async (event: DatabaseEvent, targetYear: number) => {
    try {
      const sourceYear = Array.isArray(event.years) && event.years.length > 0
        ? event.years[0]
        : new Date().getFullYear();
      
      if (sourceYear === targetYear) {
        toast({
          title: t("error"),
          description: t("cannotDuplicateToSameYear") || "Cannot duplicate event to the same year",
          variant: "destructive",
        });
        return;
      }
      
      const { duplicateEventToYearMCP } = await import('@/lib/mcpYearEvents');
      
      await duplicateEventToYearMCP(sourceYear, targetYear, event.id);
      
      toast({
        title: t("eventDuplicatedSuccessfully") || "Event duplicated successfully",
        description: `${t("duplicatedToYear") || "Duplicated to"} ${targetYear}`,
      });
      
      setDuplicateDialogOpen(false);
      setEventToDuplicate(null);
      loadEvents();
    } catch (error: any) {
      logError('Admin', error, { operation: 'duplicateEvent', eventId: event.id, targetYear });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToDuplicateEvent") || "Failed to duplicate event",
        variant: "destructive",
      });
    }
  };

  const handleSaveFAQ = async (faqData: Omit<FAQItem, 'id'>) => {
    try {
      if (editingFAQ) {
        if (import.meta.env.DEV) {
          console.log('[Admin] Updating FAQ:', editingFAQ.id);
        }
        const { error } = await supabase
          .from('faqs')
          .update(faqData)
          .eq('id', editingFAQ.id);
        
        if (error) {
          logError('Admin', error, { operation: 'updateFAQ', faqId: editingFAQ.id });
          throw error;
        }
        toast({ title: t("faqUpdatedSuccessfully") });
      } else {
        if (import.meta.env.DEV) {
          console.log('[Admin] Creating new FAQ');
        }
        const { error } = await supabase
          .from('faqs')
          .insert([faqData]);
        
        if (error) {
          logError('Admin', error, { operation: 'createFAQ' });
          throw error;
        }
        toast({ title: t("faqCreatedSuccessfully") });
      }
      
      loadFAQs();
      setEditingFAQ(null);
      setIsFAQCreateOpen(false);
    } catch (error: any) {
      logError('Admin', error, { operation: 'saveFAQ' });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToSaveFAQ"),
        variant: "destructive",
      });
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm(t("areYouSureDeleteFAQ"))) return;
    
    try {
      if (import.meta.env.DEV) {
        console.log('[Admin] Deleting FAQ:', id);
      }
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      
      if (error) {
        logError('Admin', error, { operation: 'deleteFAQ', faqId: id });
        throw error;
      }
      toast({ title: t("faqDeletedSuccessfully") });
      loadFAQs();
    } catch (error: any) {
      logError('Admin', error, { operation: 'deleteFAQ', faqId: id });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToDeleteFAQ"),
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
        logError('Admin', error, { operation: 'toggleFAQVisibility', faqId: id });
        throw error;
      }
      toast({
        title: currentVisibility ? t("faqHiddenFromPublic") : t("faqMadeVisibleToPublic") 
      });
      loadFAQs();
    } catch (error: any) {
      logError('Admin', error, { operation: 'toggleFAQVisibility', faqId: id });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToUpdateFAQVisibility"),
        variant: "destructive",
      });
    }
  };

  const handleHideAllFAQs = async () => {
    if (!confirm(t("areYouSureHideAllFAQs") || "Are you sure you want to hide all FAQs? This will make all FAQs invisible to the public.")) return;
    
    try {
      console.log('[Admin] Hiding all FAQs');
      const { error } = await supabase
        .from('faqs')
        .update({ is_visible: false });
      
      if (error) {
        logError('Admin', error, { operation: 'hideAllFAQs' });
        throw error;
      }
      
      toast({
        title: t("allFAQsHiddenSuccessfully") || "All FAQs hidden successfully"
      });
      loadFAQs();
    } catch (error: any) {
      logError('Admin', error, { operation: 'hideAllFAQs' });
      toast({
        title: t("error"),
        description: formatSupabaseError(error) || t("failedToHideAllFAQs") || "Failed to hide all FAQs. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Normalize email helper
  const normalizeEmail = (email: string | null | undefined): string | null => {
    if (!email) return null;
    return email.trim().toLowerCase();
  };

  // Load users with admin status (optimized single query approach)
  const loadUsers = async () => {
    if (!isAdmin) return;
    
    setUsersLoading(true);
    try {
      // Fetch all profiles, admin roles, super admin roles, and admin emails in parallel
      const [profilesResult, adminRolesResult, superAdminRolesResult, adminEmailsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, email, full_name, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin'),
        supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'super_admin'),
        supabase
          .from('admin_emails')
          .select('email')
      ]);

      if (profilesResult.error) {
        console.error('[Admin] Error loading profiles:', profilesResult.error);
        throw profilesResult.error;
      }
      if (adminRolesResult.error) {
        console.error('[Admin] Error loading admin roles:', adminRolesResult.error);
        throw adminRolesResult.error;
      }
      if (superAdminRolesResult.error) {
        console.error('[Admin] Error loading super admin roles:', superAdminRolesResult.error);
        throw superAdminRolesResult.error;
      }
      if (adminEmailsResult.error) {
        console.error('[Admin] Error loading admin emails:', adminEmailsResult.error);
        throw adminEmailsResult.error;
      }

      // Create sets for fast lookup
      const adminUserIds = new Set((adminRolesResult.data || []).map(r => r.user_id));
      const superAdminUserIds = new Set((superAdminRolesResult.data || []).map(r => r.user_id));
      const adminEmailSet = new Set(
        (adminEmailsResult.data || []).map((e: { email: string }) => normalizeEmail(e.email)).filter(Boolean)
      );

      // Combine data in memory
      const usersWithStatus: UserWithAdminStatus[] = (profilesResult.data || []).map(profile => {
        const normalizedProfileEmail = normalizeEmail(profile.email);
        const isSuperAdmin = superAdminUserIds.has(profile.id);
        const isAdmin = 
          adminUserIds.has(profile.id) ||
          (normalizedProfileEmail !== null && adminEmailSet.has(normalizedProfileEmail)) ||
          isSuperAdmin; // Super admins are also admins
        
        return {
          ...profile,
          isAdmin,
          isSuperAdmin
        };
      });

      setUsers(usersWithStatus);
      if (import.meta.env.DEV) {
        console.log(`[Admin] Successfully loaded ${usersWithStatus.length} users with admin status`);
      }
    } catch (error: any) {
      console.error('[Admin] Error in loadUsers:', error);
      logError('Admin', error, { operation: 'loadUsers' });
      toast({
        title: t("error"),
        description: error?.message || t("errorLoadingUsers"),
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  // Add admin privileges (optimized parallel batch operation)
  const addAdminPrivileges = async (userId: string, email: string | null) => {
    if (!email) {
      toast({
        title: t("error"),
        description: t("invalidEmail"),
        variant: "destructive",
      });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !validateEmail(normalizedEmail)) {
      toast({
        title: t("error"),
        description: t("invalidEmail"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Optimistic update
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        const updatedUsers = [...users];
        updatedUsers[userIndex] = { ...updatedUsers[userIndex], isAdmin: true };
        setUsers(updatedUsers);
      }

      // Execute parallel batch operations
      const [roleResult, emailResult] = await Promise.all([
        supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'admin' }, { onConflict: 'user_id,role' })
          .select()
          .single(),
        supabase
          .from('admin_emails')
          .upsert({ email: normalizedEmail }, { onConflict: 'email' })
          .select()
          .single()
      ]);

      if (roleResult.error) {
        throw roleResult.error;
      }
      if (emailResult.error) {
        throw emailResult.error;
      }

      toast({
        title: t("adminPrivilegesAdded"),
      });
      
      // Reload to ensure consistency
      await loadUsers();
    } catch (error: any) {
      logError('Admin', error, { operation: 'addAdminPrivileges', userId, email });
      toast({
        title: t("error"),
        description: t("errorAddingAdmin"),
        variant: "destructive",
      });
      // Rollback optimistic update
      await loadUsers();
    }
  };

  // Remove admin privileges (optimized parallel batch operation)
  const removeAdminPrivileges = async (userId: string, email: string | null) => {
    // Prevent self-demotion
    if (user?.id === userId) {
      toast({
        title: t("error"),
        description: t("cannotRemoveOwnAdmin"),
        variant: "destructive",
      });
      return;
    }

    const normalizedEmail = normalizeEmail(email);

    try {
      // Optimistic update
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        const updatedUsers = [...users];
        updatedUsers[userIndex] = { ...updatedUsers[userIndex], isAdmin: false };
        setUsers(updatedUsers);
      }

      // Execute parallel batch deletions
      const [userRoleDeleteResult, adminEmailDeleteResult] = await Promise.all([
        supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin'),
        normalizedEmail
          ? supabase
              .from('admin_emails')
              .delete()
              .eq('email', normalizedEmail)
          : Promise.resolve({ data: null, error: null })
      ]);

      // Check for errors
      if (userRoleDeleteResult.error) {
        throw userRoleDeleteResult.error;
      }
      if (adminEmailDeleteResult && 'error' in adminEmailDeleteResult && adminEmailDeleteResult.error) {
        throw adminEmailDeleteResult.error;
      }

      toast({
        title: t("adminPrivilegesRemoved"),
      });
      
      // Reload to ensure consistency
      await loadUsers();
    } catch (error: any) {
      logError('Admin', error, { operation: 'removeAdminPrivileges', userId, email });
      toast({
        title: t("error"),
        description: t("errorRemovingAdmin"),
        variant: "destructive",
      });
      // Rollback optimistic update
      await loadUsers();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Reset password for user (admin function)
  const handleResetPassword = async (targetUser: UserWithAdminStatus) => {
    if (!targetUser.email) {
      toast({
        title: t("error"),
        description: t("invalidEmail"),
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await resetPasswordForEmail(targetUser.email);
      
      if (result?.error) {
        logError('Admin', result.error, { operation: 'resetPassword', userId: targetUser.id, email: targetUser.email });
        toast({
          title: t("error"),
          description: result.error.message || t("unexpectedError"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("adminResetPasswordSent").replace('{email}', targetUser.email),
        });
      }
    } catch (error: any) {
      logError('Admin', error, { operation: 'resetPassword', userId: targetUser.id });
      toast({
        title: t("error"),
        description: error?.message || t("unexpectedError"),
        variant: "destructive",
      });
    } finally {
      setResetPasswordDialogOpen(false);
      setUserToResetPassword(null);
    }
  };

  // Get available years from yearly tables
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  useEffect(() => {
    if (activeTab === "events") {
      import('@/lib/yearEvents').then(({ getAvailableYears }) => {
        getAvailableYears().then(years => {
          setAvailableYears(years.sort((a, b) => b - a));
        });
      });
    }
  }, [activeTab]);

  // Filter events based on selected year, visibility mode, and debounced search query
  const filteredEvents = useMemo(() => events.filter(event => {
    // Filter by visibility mode first
    if (showHiddenMode) {
      // In hidden mode, only show hidden events
      if (event.is_visible !== false) {
        return false;
      }
    } else {
      // In normal mode, show all events (both visible and hidden)
      // No filter needed here
    }
    
    // Filter by year - check if event's years array includes selected year
    // Events now belong to a single year (first year in years array)
    if (selectedYear !== "all") {
      const eventYear = Array.isArray(event.years) && event.years.length > 0
        ? event.years[0]
        : null;
      if (eventYear !== selectedYear) {
        return false;
      }
    }
    
    // Then filter by search query
    const query = debouncedSearchQuery.toLowerCase();
    if (!query) return true;
    
    // Check basic fields
    if (
      event.title.toLowerCase().includes(query) ||
      event.venue.toLowerCase().includes(query) ||
      event.day.toLowerCase().includes(query) ||
      event.type.toLowerCase().includes(query)
    ) {
      return true;
    }
    
    // Check description (handle JSON format)
    if (event.description) {
      try {
        const parsed = JSON.parse(event.description);
        if (typeof parsed === 'object' && (parsed.en || parsed.de)) {
          const descText = `${parsed.en || ''} ${parsed.de || ''}`.toLowerCase();
          if (descText.includes(query)) return true;
        }
      } catch {
        // If not JSON, treat as plain text
        if (event.description.toLowerCase().includes(query)) return true;
      }
    }
    
    return false;
  }), [events, showHiddenMode, selectedYear, debouncedSearchQuery]);

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
      // Prefer start_time if available, otherwise parse from time field
      const timeA = a.start_time || a.time?.split(' - ')[0] || a.time || '00:00';
      const timeB = b.start_time || b.time?.split(' - ')[0] || b.time || '00:00';
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-3 md:gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {t("adminDashboard")}
            </h1>
            {/* Tab Navigation - Centered */}
            <div className="flex gap-1 bg-muted rounded-lg p-1 w-full sm:w-fit overflow-x-auto">
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
              <Button
                variant={activeTab === "users" ? "default" : "ghost"}
                onClick={() => setActiveTab("users")}
                className="gap-2 text-sm py-2 px-3"
                size="sm"
              >
                <UsersIcon className="h-3 w-3" />
                {t("users")}
              </Button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Button onClick={() => navigate('/')} variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                {t("backToFestival")}
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm" className="text-xs sm:text-sm flex-1 sm:flex-initial">
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {t("signOut")}
              </Button>
            </div>
          </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 md:gap-4">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold">
            {activeTab === "events" ? t("eventsManagement") : activeTab === "faqs" ? t("faqManagement") : activeTab === "tickets" ? t("ticketSettings") : activeTab === "users" ? t("userManagement") : t("aboutUsManagement")}
          </h2>
          <div className="flex gap-2 sm:gap-3">
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
              <div className="flex gap-2">
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
                      <FAQForm onSave={handleSaveFAQ} allFAQs={faqs} />
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="destructive" 
                  className="min-h-[44px]"
                  onClick={handleHideAllFAQs}
                >
                  <EyeOff className="h-4 w-4 mr-2" />
                  {t("hideAllFAQs") || "Hide All FAQs"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Notes Section - only show for tickets settings tab */}
        {activeTab === "tickets" && ticketSubTab === "settings" && (
          <Card className="mb-4 md:mb-6">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-2">
                <Label htmlFor="admin-notes" className="text-sm font-medium">
                  {t("notes") || "Notes"}
                  {notesSaving && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 inline animate-spin mr-1" />
                      {t("saving") || "Saving..."}
                    </span>
                  )}
                </Label>
                <Textarea
                  id="admin-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("addNotes") || "Add your notes here... (autosaves)"}
                  rows={6}
                  className="min-h-[150px] resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  {t("notesAutosave") || "Notes are automatically saved as you type"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Year Filter and Search Bar - only show for events tab */}
        {activeTab === "events" && (
          <div className="mb-4 md:mb-6 lg:mb-8 space-y-3 md:space-y-4">
            {/* Year Filter Tabs */}
            {availableYears.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Filter by Year:</span>
                <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1 max-w-full">
                  {availableYears.map((year) => {
                    // Ensure year is a valid number and convert to string for display
                    const yearNum = typeof year === 'number' ? year : parseInt(String(year), 10);
                    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
                      return null; // Skip invalid years
                    }
                    const yearStr = String(yearNum);
                    
                    return (
                      <Button
                        key={`year-${yearNum}`}
                        variant={selectedYear === yearNum ? "default" : "ghost"}
                        onClick={() => setSelectedYear(yearNum)}
                        size="sm"
                        className="text-sm whitespace-nowrap shrink-0"
                      >
                        {yearStr}
                      </Button>
                    );
                  })}
                </div>
                {/* Bulk visibility toggle for selected year */}
                {selectedYear !== "all" && (
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleYearVisibility(selectedYear, true)}
                      className="text-sm"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Show All {selectedYear}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleYearVisibility(selectedYear, false)}
                      className="text-sm"
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hide All {selectedYear}
                    </Button>
                  </div>
                )}
              </div>
            )}
            {/* Search Bar */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t("searchEvents")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
          {(searchQuery || selectedYear !== "all") && (
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
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 overflow-x-auto pb-4">
                {sortedDays.map((day) => (
                  <div key={day} className="flex-shrink-0 w-full md:w-[calc(33.333%-16px)] md:min-w-[280px] space-y-3 md:space-y-4">
                    {/* Day Header */}
                    <div className="flex items-center gap-2 md:gap-3 pb-2 border-b border-border">
                      <h3 className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                        {day}
                      </h3>
                       <span className="text-xs md:text-sm text-muted-foreground">
                         ({eventsByDay[day].length} {eventsByDay[day].length === 1 ? t("event") : t("events_plural")})
                       </span>
                    </div>

                    {/* Events for this day */}
                    <div className="space-y-3 md:space-y-4 lg:space-y-6">
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
                          <CardContent className="p-4 md:p-5 lg:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 md:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2">
                                  <h3 className="font-semibold text-base md:text-lg break-words">{event.title}</h3>
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
                                <p className="text-xs md:text-sm text-muted-foreground mb-2 break-words">
                                  {event.startTime && event.endTime ? `${event.startTime} - ${event.endTime}` : event.time} • {event.venue} • {event.type}
                                  {Array.isArray(event.years) && event.years.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 rounded bg-muted text-xs font-medium">
                                      {event.years[0]}
                                    </span>
                                  )}
                                </p>
                                {event.description && (
                                  <div className="text-xs md:text-sm text-muted-foreground mt-2">
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
                              <div className="flex gap-2 md:gap-3 flex-shrink-0">
                                <Button
                                  variant={event.is_visible === false ? "default" : "outline"}
                                  size="sm"
                                  className="h-8 w-8 md:h-9 md:w-9 p-0"
                                  onClick={() => {
                                    const eventYear = Array.isArray(event.years) && event.years.length > 0
                                      ? event.years[0]
                                      : undefined;
                                    handleToggleVisibility(event.id, event.is_visible !== false, eventYear);
                                  }}
                                  title={event.is_visible === false ? t("makeVisible") : t("hideFromPublic")}
                                >
                                  {event.is_visible === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                                <Dialog 
                                  open={editingEvent?.id === event.id} 
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setEditingEvent(null);
                                    } else {
                                      setEditingEvent(event);
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="h-8 w-8 md:h-9 md:w-9 p-0"
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
                                        initialEvent={editingEvent || event}
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 md:h-9 md:w-9 p-0"
                                  onClick={() => {
                                    setEventToDuplicate(event);
                                    setTargetYear(new Date().getFullYear() + 1);
                                    setDuplicateDialogOpen(true);
                                  }}
                                  title={t("duplicateEvent") || "Duplicate Event"}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  className="h-8 w-8 md:h-9 md:w-9 p-0"
                                  onClick={() => {
                                    const eventYear = Array.isArray(event.years) && event.years.length > 0
                                      ? event.years[0]
                                      : undefined;
                                    handleDeleteEvent(event.id, eventYear);
                                  }}
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
            {/* FAQ Search and Filters */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t("searchFAQs") || "Search FAQs..."}
                        value={faqSearchQuery}
                        onChange={(e) => setFaqSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="w-full md:w-48">
                    <Select value={faqFilterCategory} onValueChange={setFaqFilterCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("allCategories") || "All Categories"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allCategories") || "All Categories"}</SelectItem>
                        {Array.from(new Set(faqs.map(f => f.category).filter(Boolean))).sort().map(cat => (
                          <SelectItem key={cat} value={cat || ''}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Language Filter */}
                  <div className="w-full md:w-40">
                    <Select value={faqFilterLanguage} onValueChange={setFaqFilterLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("allLanguages") || "All Languages"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allLanguages") || "All Languages"}</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Visibility Filter */}
                  <div className="w-full md:w-40">
                    <Select value={faqFilterVisibility} onValueChange={setFaqFilterVisibility}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("allVisibility") || "All"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("allVisibility") || "All"}</SelectItem>
                        <SelectItem value="visible">{t("visible") || "Visible"}</SelectItem>
                        <SelectItem value="hidden">{t("hidden") || "Hidden"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Clear Filters */}
                  {(faqSearchQuery || faqFilterCategory !== "all" || faqFilterLanguage !== "all" || faqFilterVisibility !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFaqSearchQuery("");
                        setFaqFilterCategory("all");
                        setFaqFilterLanguage("all");
                        setFaqFilterVisibility("all");
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      {t("clearFilters") || "Clear"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {(() => {
              // Filter FAQs based on search and filters
              const filteredFAQs = faqs.filter(faq => {
                // Search filter
                if (faqSearchQuery) {
                  const query = faqSearchQuery.toLowerCase();
                  const matchesSearch = 
                    faq.question.toLowerCase().includes(query) ||
                    faq.answer.toLowerCase().includes(query) ||
                    (faq.category && faq.category.toLowerCase().includes(query)) ||
                    (faq.subcategory && faq.subcategory.toLowerCase().includes(query));
                  if (!matchesSearch) return false;
                }
                
                // Category filter
                if (faqFilterCategory !== "all") {
                  if (faq.category !== faqFilterCategory) return false;
                }
                
                // Language filter
                if (faqFilterLanguage !== "all") {
                  if (faq.language !== faqFilterLanguage) return false;
                }
                
                // Visibility filter
                if (faqFilterVisibility !== "all") {
                  if (faqFilterVisibility === "visible" && !faq.is_visible) return false;
                  if (faqFilterVisibility === "hidden" && faq.is_visible) return false;
                }
                
                return true;
              });

              if (filteredFAQs.length === 0) {
                return (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-xl font-semibold mb-2">
                        {t("noFAQsFound") || "No FAQs found"}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {t("tryAdjustingFilters") || "Try adjusting your search or filters"}
                      </p>
                    </CardContent>
                  </Card>
                );
              }

              // Group FAQs by category
              const faqsByCategory = filteredFAQs.reduce((acc, faq) => {
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
                      
                      // Topic-based FAQ pairing algorithm
                      // Pair FAQs by their position/topic within the subcategory, not by order_index
                      // order_index is only used for sorting the final display order
                      
                      // Separate FAQs by language and sort by order_index for display
                      const germanFAQs = subcategoryFAQs
                        .filter(faq => faq.language === 'de')
                        .sort((a, b) => a.order_index - b.order_index);
                      const englishFAQs = subcategoryFAQs
                        .filter(faq => faq.language === 'en')
                        .sort((a, b) => a.order_index - b.order_index);
                      
                      // Pair FAQs by position within subcategory (1st DE with 1st EN, 2nd DE with 2nd EN, etc.)
                      // This matches FAQs by topic since they're already grouped by category/subcategory
                      const pairedFAQs: Array<{ de?: FAQItem; en?: FAQItem; orderIndex: number }> = [];
                      const minCount = Math.min(germanFAQs.length, englishFAQs.length);
                      
                      // Pair FAQs by position (topic matching)
                      for (let i = 0; i < minCount; i++) {
                        // Use the minimum order_index from the pair for display sorting
                        const orderIndex = Math.min(
                          germanFAQs[i].order_index,
                          englishFAQs[i].order_index
                        );
                        
                        pairedFAQs.push({
                          de: germanFAQs[i],
                          en: englishFAQs[i],
                          orderIndex: orderIndex
                        });
                      }
                      
                      // Add remaining unpaired FAQs as single-language entries
                      // Use order_index for sorting these as well
                      if (germanFAQs.length > englishFAQs.length) {
                        germanFAQs.slice(minCount).forEach(faq => {
                          pairedFAQs.push({
                            de: faq,
                            orderIndex: faq.order_index
                          });
                        });
                      } else if (englishFAQs.length > germanFAQs.length) {
                        englishFAQs.slice(minCount).forEach(faq => {
                          pairedFAQs.push({
                            en: faq,
                            orderIndex: faq.order_index
                          });
                        });
                      }
                      
                      // Sort all pairs by orderIndex for display (order_index is for website visitor display order)
                      pairedFAQs.sort((a, b) => a.orderIndex - b.orderIndex);

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

                          {/* FAQs grouped by intelligent pairing */}
                          <div className="space-y-4">
                            {pairedFAQs.map((pair, pairIndex) => {
                              const germanFAQ = pair.de;
                              const englishFAQ = pair.en;
                              const pairKey = `${subcategory}-${pairIndex}-${pair.orderIndex}`;

                              // Helper function to render FAQ card
                              const renderFAQCards = (faq: FAQItem | undefined, language: 'de' | 'en', label: string) => {
                                if (!faq) return null;

                                return (
                                  <Card key={`${pairKey}-${language}`} className={`flex-1 ${faq.is_visible === false ? "border-destructive/50 bg-destructive/5" : ""}`}>
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
                                             {faq.is_visible === false && (
                                               <div className="flex items-center text-destructive text-xs">
                                                 <EyeOff className="h-3 w-3 mr-1" />
                                                 {t("hidden")}
                                               </div>
                                             )}
                                          </div>
                                          <h3 className="font-semibold text-base mb-1">{faq.question}</h3>
                                          <div className="text-sm text-muted-foreground mt-2">
                                            {faq.answer}
                                          </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                          <Button
                                            variant={faq.is_visible === false ? "default" : "outline"}
                                            size="sm"
                                             onClick={() => handleToggleFAQVisibility(faq.id, faq.is_visible !== false)}
                                             title={faq.is_visible === false ? t("makeVisible") : t("hideFromPublic")}
                                          >
                                            {faq.is_visible === false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                          </Button>
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setEditingFAQ(faq)}
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
                                                  initialFAQ={faq}
                                                  allFAQs={faqs}
                                                />
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                          <Button 
                                            variant="destructive" 
                                            size="sm"
                                            onClick={() => handleDeleteFAQ(faq.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              };

                              return (
                                <div key={pairKey} className="flex gap-4">
                                  {renderFAQCards(germanFAQ, 'de', 'DE')}
                                  {renderFAQCards(englishFAQ, 'en', 'EN')}
                                  {/* Show message if no FAQs exist in this pair */}
                                  {!germanFAQ && !englishFAQ && (
                                    <Card className="flex-1 border-dashed">
                                      <CardContent className="p-4 text-center text-muted-foreground">
                                        {t("noFAQsFound") || "No FAQs found in this pair"}
                                      </CardContent>
                                    </Card>
                                  )}
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
            <div className="flex gap-2 border-b border-border pb-2 items-center justify-between">
              <div className="flex gap-2">
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
                {t("pendingSoliContributions")} ({uncheckedPurchases.length})
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
              <Button
                type="button"
                variant={ticketSubTab === "cancelled" ? "default" : "ghost"}
                onClick={() => {
                  setTicketSubTab("cancelled");
                  loadTicketPurchases();
                }}
                size="sm"
              >
                {t("cancelledSoliContributions")} ({cancelledPurchases.length})
              </Button>
              </div>
              {ticketSubTab !== "settings" && (
                <Button
                  type="button"
                  onClick={() => setIsCreatePurchaseOpen(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t("addSoliContribution")}
                </Button>
              )}
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
                    {uncheckedPurchases.length === 0 ? (
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
                          // Yellow border for pending tab
                          const borderClass = 'border-yellow-500';
                          
                          return (
                          <Card key={purchase.id} className={borderClass}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">{purchase.purchaser_name}</span>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      purchase.status === 'confirmed' ? 'bg-green-500/20 text-green-700' :
                                      'bg-gray-500/20 text-gray-700'
                                    }`}>
                                      {purchase.status === 'confirmed' ? t("confirmed") : t("cancelled")}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{purchase.purchaser_email}</p>
                                  {purchase.phone_number && (
                                    <p className="text-sm text-muted-foreground">{t("phoneNumber")}: {purchase.phone_number}</p>
                                  )}
                                  <p className="text-sm">
                                    <span className="font-medium">{purchase.contribution_type}</span> - {purchase.role} - {purchase.price.toFixed(2)}€
                                  </p>
                                  {purchase.payment_reference && (
                                    <p className="text-xs text-muted-foreground">{t("payment")}: {purchase.payment_reference}</p>
                                  )}
                                  {purchase.notes && (
                                    <p className="text-xs text-muted-foreground">{t("purchaseNotes")}: {purchase.notes}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(purchase.created_at).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <label className="flex items-center gap-2 cursor-pointer">
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
                                            logError('Admin', error, { operation: 'updateCheckedFlag', purchaseId: purchase.id });
                                            toast({
                                              title: t("error"),
                                              description: formatSupabaseError(error) || t("failedToUpdateCheckedState"),
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
                                          logError('Admin', err, { operation: 'updateCheckedFlag', purchaseId: purchase.id });
                                          toast({
                                            title: t("error"),
                                            description: formatSupabaseError(err) || t("failedToUpdateCheckedState"),
                                            variant: "destructive",
                                          });
                                        }
                                      }}
                                      className="h-5 w-5 cursor-pointer rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                    />
                                    <span className="text-sm font-medium">{t("checked")}</span>
                                  </label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingPurchase(purchase)}
                                    className="mt-2"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    {t("edit")}
                                  </Button>
                                  {purchase.status === 'confirmed' && (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleCancelPurchase(purchase.id)}
                                      className="mt-2"
                                    >
                                      <XCircle className="h-4 w-4 mr-1" />
                                      {t("cancel")}
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => openDeleteDialog(purchase.id)}
                                    className="mt-2"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    {t("delete")}
                                  </Button>
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
            ) : ticketSubTab === "checked" ? (
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
                                    {purchase.phone_number && (
                                      <p className="text-sm text-muted-foreground">{t("phoneNumber")}: {purchase.phone_number}</p>
                                    )}
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
                                    <label className="flex items-center gap-2 cursor-pointer">
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
                                              logError('Admin', error, { operation: 'updateCheckedFlag', purchaseId: purchase.id });
                                              toast({
                                                title: t("error"),
                                                description: formatSupabaseError(error) || t("failedToUpdateCheckedState"),
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
                                            logError('Admin', err, { operation: 'updateCheckedFlag', purchaseId: purchase.id });
                                            toast({
                                              title: t("error"),
                                              description: err?.message || t("failedToUpdateCheckedState"),
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                        className="h-5 w-5 cursor-pointer rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
                                      />
                                      <span className="text-sm font-medium">{t("checked")}</span>
                                    </label>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingPurchase(purchase)}
                                      className="mt-2"
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      {t("edit")}
                                    </Button>
                                    {purchase.status === 'confirmed' && (
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleCancelPurchase(purchase.id)}
                                        className="mt-2"
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        {t("cancel")}
                                      </Button>
                                    )}
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => openDeleteDialog(purchase.id)}
                                      className="mt-2"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      {t("delete")}
                                    </Button>
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
            ) : (
              // Cancelled Soli-Contributions tab
              purchasesLoading ? (
                <div className="text-center text-muted-foreground py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>{t("loadingCancelledPurchases")}</p>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("cancelledSoliContributions")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cancelledPurchases.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        {t("noCancelledPurchasesYet")}
                      </p>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="Search by name or reference..."
                            value={cancelledSearchQuery}
                            onChange={(e) => setCancelledSearchQuery(e.target.value)}
                            className="max-w-sm"
                          />
                        </div>
                        {filteredCancelledPurchases.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            {cancelledSearchQuery ? t("noResultsFound") || "No results found" : t("noCancelledPurchasesYet")}
                          </p>
                        ) : (
                          filteredCancelledPurchases.map((purchase) => (
                            <Card key={purchase.id} className="border-red-500">
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold">{purchase.purchaser_name}</span>
                                      <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-700">
                                        {t("cancelled")}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{purchase.purchaser_email}</p>
                                    {purchase.phone_number && (
                                      <p className="text-sm text-muted-foreground">{t("phoneNumber")}: {purchase.phone_number}</p>
                                    )}
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
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingPurchase(purchase)}
                                    >
                                      <Edit className="h-4 w-4 mr-1" />
                                      {t("edit")}
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleReactivatePurchase(purchase.id)}
                                      className="mt-2"
                                    >
                                      {t("reactivate")}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => openDeleteDialog(purchase.id)}
                                      className="mt-2"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      {t("delete")}
                                    </Button>
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

            {/* Create/Edit Purchase Dialog */}
            {(isCreatePurchaseOpen || editingPurchase) && (
              <Dialog 
                open={isCreatePurchaseOpen || !!editingPurchase} 
                onOpenChange={(open) => {
                  if (!open) {
                    setIsCreatePurchaseOpen(false);
                    setEditingPurchase(null);
                  }
                }}
              >
                <DialogContent className="max-w-2xl max-h-[90vh] mx-4 sm:mx-auto overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingPurchase ? t("editSoliContribution") : t("addSoliContribution")}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPurchase 
                        ? t("editSoliContributionDesc") || "Edit the details of this Soli-Contribution"
                        : t("addSoliContributionDesc") || "Manually add a new Soli-Contribution"}
                    </DialogDescription>
                  </DialogHeader>
                  <AdminPurchaseForm
                    purchase={editingPurchase}
                    onSave={async (purchaseData) => {
                      if (editingPurchase) {
                        // Update existing purchase
                        const result = await updateTicketPurchaseAdmin(editingPurchase.id, purchaseData);
                        if (result.success && result.purchase) {
                          setTicketPurchases(prev =>
                            prev.map(p => p.id === editingPurchase.id ? result.purchase! : p)
                          );
                          toast({
                            title: t("success"),
                            description: t("adminUpdatePurchaseSuccess"),
                          });
                          setEditingPurchase(null);
                        } else {
                          toast({
                            title: t("error"),
                            description: result.error || t("failedToSavePurchase"),
                            variant: "destructive",
                          });
                        }
                      } else {
                        // Create new purchase
                        const result = await createTicketPurchaseAdmin(purchaseData);
                        if (result.success && result.purchase) {
                          setTicketPurchases(prev => [result.purchase!, ...prev]);
                          toast({
                            title: t("success"),
                            description: t("adminCreatePurchaseSuccess"),
                          });
                          setIsCreatePurchaseOpen(false);
                        } else {
                          toast({
                            title: t("error"),
                            description: result.error || t("failedToSavePurchase"),
                            variant: "destructive",
                          });
                        }
                      }
                    }}
                    onCancel={() => {
                      setIsCreatePurchaseOpen(false);
                      setEditingPurchase(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
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
        ) : activeTab === "users" ? (
          <div className="w-full space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchUsers")}
                  value={usersSearchQuery}
                  onChange={(e) => setUsersSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Users List */}
            {usersLoading ? (
              <div className="text-center text-muted-foreground py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>{t("loadingUsers")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const filteredUsers = users.filter(user => {
                    if (!usersSearchQuery) return true;
                    const query = usersSearchQuery.toLowerCase();
                    return (
                      (user.email?.toLowerCase().includes(query))
                    );
                  });

                  if (filteredUsers.length === 0) {
                    return (
                      <div className="text-center text-muted-foreground py-12">
                        <p>{t("noUsersFound")}</p>
                      </div>
                    );
                  }

                  return filteredUsers.map((user) => (
                    <Card key={user.id} className="border-2">
                      <CardContent className="p-4 md:p-5">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold text-base md:text-lg break-words">
                                {user.email || t("userNotFound")}
                              </h3>
                              {user.isSuperAdmin && (
                                <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                                  {t("isSuperAdmin")}
                                </Badge>
                              )}
                              <Badge variant={user.isAdmin ? "default" : "outline"}>
                                {user.isAdmin ? t("isAdmin") : t("notAdmin")}
                              </Badge>
                            </div>
                          </div>
                          {isSuperAdmin && (
                            <div className="flex gap-2 flex-shrink-0 flex-wrap">
                              {user.isAdmin ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setUserToModify(user);
                                    setRemoveAdminDialogOpen(true);
                                  }}
                                  className="gap-2"
                                >
                                  <ShieldOff className="h-4 w-4" />
                                  {t("removeAdminPrivileges")}
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => addAdminPrivileges(user.id, user.email)}
                                  className="gap-2"
                                >
                                  <Shield className="h-4 w-4" />
                                  {t("addAdminPrivileges")}
                                </Button>
                              )}
                              {user.email && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setUserToResetPassword(user);
                                    setResetPasswordDialogOpen(true);
                                  }}
                                  className="gap-2"
                                >
                                  <UsersIcon className="h-4 w-4" />
                                  {t("adminResetPassword")}
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            )}
          </div>
        ) : null}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmDelete")}</DialogTitle>
            <DialogDescription>
              {t("areYouSureDeletePurchase")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setPurchaseToDelete(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (purchaseToDelete) {
                  handleDeletePurchase(purchaseToDelete);
                }
              }}
            >
              {t("delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Admin Confirmation Dialog */}
      <Dialog open={removeAdminDialogOpen} onOpenChange={setRemoveAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("confirmRemoveAdmin")}</DialogTitle>
            <DialogDescription>
              {t("confirmRemoveAdminDesc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRemoveAdminDialogOpen(false);
                setUserToModify(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (userToModify) {
                  removeAdminPrivileges(userToModify.id, userToModify.email);
                  setRemoveAdminDialogOpen(false);
                  setUserToModify(null);
                }
              }}
            >
              {t("removeAdminPrivileges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("adminResetPassword")}</DialogTitle>
            <DialogDescription>
              {userToResetPassword?.email 
                ? t("adminResetPasswordConfirm").replace('{email}', userToResetPassword.email)
                : t("adminResetPasswordConfirm").replace('{email}', 'this user')
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResetPasswordDialogOpen(false);
                setUserToResetPassword(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (userToResetPassword) {
                  handleResetPassword(userToResetPassword);
                }
              }}
            >
              {t("sendResetEmail")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Event Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("duplicateEvent") || "Duplicate Event"}</DialogTitle>
            <DialogDescription>
              {eventToDuplicate && (
                <>
                  {t("duplicateEventDescription") || "Select the target year to duplicate this event to:"}
                  <br />
                  <strong>{eventToDuplicate.title}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetYear">{t("selectTargetYear") || "Select Target Year"} *</Label>
              <Select 
                value={String(targetYear)} 
                onValueChange={(value) => setTargetYear(parseInt(value, 10))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectTargetYear") || "Select Target Year"} />
                </SelectTrigger>
                <SelectContent>
                  {availableYears
                    .filter(year => {
                      const eventYear = Array.isArray(eventToDuplicate?.years) && eventToDuplicate.years.length > 0
                        ? eventToDuplicate.years[0]
                        : new Date().getFullYear();
                      return year !== eventYear;
                    })
                    .map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  {/* Also show next year if not in availableYears */}
                  {!availableYears.includes(new Date().getFullYear() + 1) && (
                    <SelectItem value={String(new Date().getFullYear() + 1)}>
                      {new Date().getFullYear() + 1}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDuplicateDialogOpen(false);
                setEventToDuplicate(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (eventToDuplicate) {
                  handleDuplicateEvent(eventToDuplicate, targetYear);
                }
              }}
            >
              {t("duplicateToYear") || "Duplicate to Year"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
    start_time: initialEvent?.start_time || initialEvent?.time?.split(' - ')[0] || '',
    end_time: initialEvent?.end_time || initialEvent?.time?.split(' - ')[1] || '',
    venue: initialEvent?.venue || '',
    day: initialEvent?.day || '',
    type: initialEvent?.type || '',
    year: Array.isArray(initialEvent?.years) && initialEvent.years.length > 0
      ? initialEvent.years[0]
      : new Date().getFullYear(),
    description_en: initialDescriptions.en,
    description_de: initialDescriptions.de,
    links: initialEvent?.links || {},
    is_visible: initialEvent?.is_visible ?? true
  });
  
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Load available years on mount
  useEffect(() => {
    import('@/lib/yearEvents').then(({ getAvailableYears }) => {
      getAvailableYears().then(years => {
        setAvailableYears(years.sort((a, b) => b - a));
      });
    });
  }, []);

  const [linksArray, setLinksArray] = useState(initialLinks);
  const [newLink, setNewLink] = useState({ platform: '', url: '' });

  const addLink = () => {
    if (newLink.platform.trim() && newLink.url.trim()) {
        // Validate URL using validation utility
        const trimmedUrl = newLink.url.trim();
        if (!isValidUrl(trimmedUrl)) {
          toast({
            title: t("invalidURL"),
            description: t("urlMustStartWithHttp"),
            variant: "destructive",
          });
          return;
        }
        
        // Sanitize URL before storing
        const sanitizedUrl = sanitizeUrl(trimmedUrl);
        if (!sanitizedUrl) {
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
        url: sanitizedUrl
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
    
    // Validate that a year is selected
    if (!formData.year || formData.year < 2020 || formData.year > 2100) {
      toast({
        title: t("error"),
        description: "Please select a valid year",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that start_time and end_time are provided
    if (!formData.start_time || !formData.end_time) {
      toast({
        title: t("error"),
        description: "Please provide both start time and end time",
        variant: "destructive",
      });
      return;
    }
    
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
    
    // Auto-generate time field from start_time and end_time
    const time = `${formData.start_time} - ${formData.end_time}`;
    
    const { description_en, description_de, year, ...eventData } = formData;
    // Convert year to years array for compatibility with DatabaseEvent interface
    onSave({ ...eventData, time, description, links: linksObject, years: [year] });
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">{t("startTime")} *</Label>
          <Input
            id="start_time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            placeholder="19:00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">{t("endTime")} *</Label>
          <Input
            id="end_time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            placeholder="20:00"
            required
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

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="year">{t("year") || "Year"} *</Label>
          <Select 
            value={String(formData.year)} 
            onValueChange={(value) => setFormData({ ...formData, year: parseInt(value, 10) })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectYear") || "Select Year"} />
            </SelectTrigger>
            <SelectContent>
              {availableYears.length > 0 ? (
                availableYears.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))
              ) : (
                // Fallback to current year and next few years if availableYears not loaded yet
                Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {!formData.year && (
            <p className="text-sm text-destructive">{t("pleaseSelectYear") || "Please select a year"}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="is_visible"
            checked={formData.is_visible}
            onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
          />
          <Label htmlFor="is_visible" className="cursor-pointer">
            {t("visibleToPublic")}
          </Label>
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
        <Label className="text-lg font-semibold">{t("eventLinks")}</Label>
        
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
  allFAQs?: FAQItem[];
}

const FAQForm = ({ onSave, initialFAQ, allFAQs = [] }: FAQFormProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    question: initialFAQ?.question || '',
    answer: initialFAQ?.answer || '',
    order_index: initialFAQ?.order_index || 0,
    is_visible: initialFAQ?.is_visible ?? true,
    category: initialFAQ?.category || '',
    subcategory: initialFAQ?.subcategory || '',
    language: initialFAQ?.language || 'de'
  });

  // Extract existing categories and subcategories for autocomplete
  const existingCategories = useMemo(() => {
    return Array.from(new Set(allFAQs.map(f => f.category).filter(Boolean))).sort();
  }, [allFAQs]);

  const existingSubcategories = useMemo(() => {
    return Array.from(new Set(allFAQs.map(f => f.subcategory).filter(Boolean))).sort();
  }, [allFAQs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.language) {
      return;
    }
    if (formData.order_index < 0) {
      return;
    }
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
        <Label htmlFor="language">{t("language")} *</Label>
        <Select
          value={formData.language}
          onValueChange={(value) => setFormData({ ...formData, language: value })}
          required
        >
          <SelectTrigger id="language">
            <SelectValue placeholder={t("selectLanguage")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="de">Deutsch (DE)</SelectItem>
            <SelectItem value="en">English (EN)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{t("category")}</Label>
        <div className="space-y-2">
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value.trim() })}
            placeholder={t("enterCategoryPlaceholder") || "e.g., A, B, C"}
            list="category-list"
          />
          <datalist id="category-list">
            {existingCategories.map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("categoryHelpText") || "Optional: Category for grouping FAQs (e.g., A, B, C)"}
          {existingCategories.length > 0 && ` Existing: ${existingCategories.slice(0, 5).join(", ")}${existingCategories.length > 5 ? "..." : ""}`}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategory">{t("subcategory")}</Label>
        <div className="space-y-2">
          <Input
            id="subcategory"
            value={formData.subcategory}
            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value.trim() })}
            placeholder={t("enterSubcategoryPlaceholder") || "e.g., Awareness, Anreise"}
            list="subcategory-list"
          />
          <datalist id="subcategory-list">
            {existingSubcategories.map(subcat => (
              <option key={subcat} value={subcat} />
            ))}
          </datalist>
        </div>
        <p className="text-xs text-muted-foreground">
          {t("subcategoryHelpText") || "Optional: Subcategory for further grouping"}
          {existingSubcategories.length > 0 && ` Existing: ${existingSubcategories.slice(0, 5).join(", ")}${existingSubcategories.length > 5 ? "..." : ""}`}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="order_index">{t("displayOrder")}</Label>
        <Input
          id="order_index"
          type="number"
          value={formData.order_index}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0;
            setFormData({ ...formData, order_index: Math.max(0, value) });
          }}
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

interface AdminPurchaseFormProps {
  purchase?: TicketPurchase | null;
  onSave: (data: {
    contribution_type: 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal' | 'fastBunny' | 'reducedFastBunny';
    role: string;
    price: number;
    purchaser_name: string;
    purchaser_email: string;
    phone_number?: string | null;
    payment_reference?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

const AdminPurchaseForm = ({ purchase, onSave, onCancel }: AdminPurchaseFormProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    contribution_type: (purchase?.contribution_type || 'earlyBird') as 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal' | 'fastBunny' | 'reducedFastBunny',
    role: purchase?.role || '',
    price: purchase?.price || 0,
    purchaser_name: purchase?.purchaser_name || '',
    purchaser_email: purchase?.purchaser_email || '',
    phone_number: purchase?.phone_number || '',
    payment_reference: purchase?.payment_reference || '',
    notes: purchase?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Define roles for the select dropdown
  const allRoles = [
    { value: 'bar', label: t('bar') },
    { value: 'kuechenhilfe', label: t('kuechenhilfe') },
    { value: 'springerRunner', label: t('springerRunner') },
    { value: 'springerToilet', label: t('springerToilet') },
    { value: 'abbau', label: t('abbau') },
    { value: 'aufbau', label: t('aufbau') },
    { value: 'awareness', label: t('awareness') },
    { value: 'tech', label: t('techSupport') },
  ];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.contribution_type) {
      newErrors.contribution_type = t('validationError') || 'Contribution type is required';
    }
    if (!formData.role) {
      newErrors.role = t('validationError') || 'Role is required';
    }
    if (!formData.price || formData.price <= 0) {
      newErrors.price = t('validationError') || 'Price must be greater than 0';
    }
    if (!formData.purchaser_name.trim()) {
      newErrors.purchaser_name = t('validationError') || 'Purchaser name is required';
    }
    if (!formData.purchaser_email.trim()) {
      newErrors.purchaser_email = t('validationError') || 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.purchaser_email)) {
      newErrors.purchaser_email = t('pleaseEnterValidEmail') || 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        contribution_type: formData.contribution_type,
        role: formData.role,
        price: formData.price,
        purchaser_name: formData.purchaser_name.trim(),
        purchaser_email: formData.purchaser_email.trim(),
        phone_number: formData.phone_number?.trim() || null,
        payment_reference: formData.payment_reference?.trim() || null,
        notes: formData.notes?.trim() || null,
      });
    } catch (error) {
      console.error('Error saving purchase:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contribution_type">{t("contributionType")} *</Label>
        <Select
          value={formData.contribution_type}
          onValueChange={(value) => setFormData({ ...formData, contribution_type: value as typeof formData.contribution_type })}
          required
        >
          <SelectTrigger id="contribution_type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="earlyBird">{t("earlyBird")}</SelectItem>
            <SelectItem value="fastBunny">{t("fastBunny")}</SelectItem>
            <SelectItem value="normal">{t("normal")}</SelectItem>
            <SelectItem value="reducedEarlyBird">{t("reducedTickets")} - {t("earlyBird")}</SelectItem>
            <SelectItem value="reducedFastBunny">{t("reducedTickets")} - {t("fastBunny")}</SelectItem>
            <SelectItem value="reducedNormal">{t("reducedTickets")} - {t("normal")}</SelectItem>
          </SelectContent>
        </Select>
        {errors.contribution_type && (
          <p className="text-sm text-destructive">{errors.contribution_type}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">{t("role")} *</Label>
        <Select
          value={formData.role}
          onValueChange={(value) => setFormData({ ...formData, role: value })}
          required
        >
          <SelectTrigger id="role">
            <SelectValue placeholder={t("selectRole")} />
          </SelectTrigger>
          <SelectContent>
            {allRoles.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-destructive">{errors.role}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">{t("purchasePrice")} (€) *</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          required
        />
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchaser_name">{t("purchaserName")} *</Label>
        <Input
          id="purchaser_name"
          value={formData.purchaser_name}
          onChange={(e) => setFormData({ ...formData, purchaser_name: e.target.value })}
          required
        />
        {errors.purchaser_name && (
          <p className="text-sm text-destructive">{errors.purchaser_name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchaser_email">{t("purchaserEmail")} *</Label>
        <Input
          id="purchaser_email"
          type="email"
          value={formData.purchaser_email}
          onChange={(e) => setFormData({ ...formData, purchaser_email: e.target.value })}
          required
        />
        {errors.purchaser_email && (
          <p className="text-sm text-destructive">{errors.purchaser_email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">{t("phoneNumber")} <span className="text-muted-foreground">({t("optional")})</span></Label>
        <Input
          id="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_reference">{t("paymentReference")} <span className="text-muted-foreground">({t("optional")})</span></Label>
        <Input
          id="payment_reference"
          value={formData.payment_reference}
          onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("notes")} <span className="text-muted-foreground">({t("optional")})</span></Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t("processing")}
            </>
          ) : (
            purchase ? t("save") : t("addSoliContribution")
          )}
        </Button>
      </DialogFooter>
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
    { key: "tech", label: t("techSupport") },
  ] as const;

  type RoleKey = (typeof standardRoles)[number]["key"] | (typeof reducedRoles)[number]["key"];

  function formatDateTimeLocalFromIso(iso: string | null | undefined): string {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (value: number): string => (value < 10 ? `0${value}` : `${value}`);

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());

    // datetime-local expects local time in "YYYY-MM-DDTHH:mm" without timezone
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const limitFieldEarlyByRole: Record<RoleKey, keyof TicketSettings> = {
    bar: "bar_limit_early",
    kuechenhilfe: "kuechenhilfe_limit_early",
    springerRunner: "springer_runner_limit_early",
    springerToilet: "springer_toilet_limit_early",
    abbau: "abbau_limit_early",
    aufbau: "aufbau_limit_early",
    awareness: "awareness_limit_early",
    tech: "tech_limit_early",
  };
  const limitFieldNormalByRole: Record<RoleKey, keyof TicketSettings> = {
    bar: "bar_limit_normal",
    kuechenhilfe: "kuechenhilfe_limit_normal",
    springerRunner: "springer_runner_limit_normal",
    springerToilet: "springer_toilet_limit_normal",
    abbau: "abbau_limit_normal",
    aufbau: "aufbau_limit_normal",
    awareness: "awareness_limit_normal",
    tech: "tech_limit_normal",
  };
  const limitFieldFastBunnyByRole: Record<RoleKey, keyof TicketSettings> = {
    bar: "bar_limit_fast_bunny",
    kuechenhilfe: "kuechenhilfe_limit_fast_bunny",
    springerRunner: "springer_runner_limit_fast_bunny",
    springerToilet: "springer_toilet_limit_fast_bunny",
    abbau: "abbau_limit_fast_bunny",
    aufbau: "aufbau_limit_fast_bunny",
    awareness: "awareness_limit_fast_bunny",
    tech: "tech_limit_fast_bunny",
  };

  const priceFieldByRole: Record<RoleKey, { early: keyof TicketSettings; fastBunny: keyof TicketSettings; normal: keyof TicketSettings }> = {
    bar: { early: "bar_price_early", fastBunny: "bar_price_fast_bunny", normal: "bar_price_normal" },
    kuechenhilfe: { early: "kuechenhilfe_price_early", fastBunny: "kuechenhilfe_price_fast_bunny", normal: "kuechenhilfe_price_normal" },
    springerRunner: { early: "springer_runner_price_early", fastBunny: "springer_runner_price_fast_bunny", normal: "springer_runner_price_normal" },
    springerToilet: { early: "springer_toilet_price_early", fastBunny: "springer_toilet_price_fast_bunny", normal: "springer_toilet_price_normal" },
    abbau: { early: "abbau_price_early", fastBunny: "abbau_price_fast_bunny", normal: "abbau_price_normal" },
    aufbau: { early: "aufbau_price_early", fastBunny: "aufbau_price_fast_bunny", normal: "aufbau_price_normal" },
    awareness: { early: "awareness_price_early", fastBunny: "awareness_price_fast_bunny", normal: "awareness_price_normal" },
    tech: { early: "tech_price_early", fastBunny: "tech_price_fast_bunny", normal: "tech_price_normal" },
  };

  const [remainingByRole, setRemainingByRole] = useState<
    Partial<Record<RoleKey, { early: number | null; fastBunny: number | null; normal: number | null }>>
  >({});

  const [remainingUniversal, setRemainingUniversal] = useState<{
    early: number | null;
    fastBunny: number | null;
    normal: number | null;
  }>({ early: null, fastBunny: null, normal: null });

  const [earlyBirdEnabled, setEarlyBirdEnabled] = useState(initialSettings?.early_bird_enabled ?? false);
  const [earlyBirdCutoff, setEarlyBirdCutoff] = useState(
    formatDateTimeLocalFromIso(initialSettings?.early_bird_cutoff ?? null)
  );
  const [fastBunnyEnabled, setFastBunnyEnabled] = useState(initialSettings?.fast_bunny_enabled ?? false);
  const [fastBunnyCutoff, setFastBunnyCutoff] = useState(
    formatDateTimeLocalFromIso(initialSettings?.fast_bunny_cutoff ?? null)
  );
  const [earlyBirdTotalLimit, setEarlyBirdTotalLimit] = useState(
    initialSettings?.early_bird_total_limit !== null && initialSettings?.early_bird_total_limit !== undefined
      ? initialSettings.early_bird_total_limit.toString()
      : ""
  );
  const [fastBunnyTotalLimit, setFastBunnyTotalLimit] = useState(
    initialSettings?.fast_bunny_total_limit !== null && initialSettings?.fast_bunny_total_limit !== undefined
      ? initialSettings.fast_bunny_total_limit.toString()
      : ""
  );
  const [normalTotalLimit, setNormalTotalLimit] = useState(
    initialSettings?.normal_total_limit !== null && initialSettings?.normal_total_limit !== undefined
      ? initialSettings.normal_total_limit.toString()
      : ""
  );
  const [paypalPaymentLink, setPaypalPaymentLink] = useState(
    initialSettings?.paypal_payment_link || ""
  );

  const [limitValuesEarly, setLimitValuesEarly] = useState<Record<RoleKey, string>>(() => {
    const initial: Record<RoleKey, string> = {
      bar: "",
      kuechenhilfe: "",
      springerRunner: "",
      springerToilet: "",
      abbau: "",
      aufbau: "",
      awareness: "",
      tech: "",
    };
    if (initialSettings) {
      (Object.keys(initial) as RoleKey[]).forEach((role) => {
        const field = limitFieldEarlyByRole[role];
        const value = initialSettings[field];
        initial[role] = value !== null && value !== undefined ? value.toString() : "";
      });
    }
    return initial;
  });
  const [limitValuesNormal, setLimitValuesNormal] = useState<Record<RoleKey, string>>(() => {
    const initial: Record<RoleKey, string> = {
      bar: "",
      kuechenhilfe: "",
      springerRunner: "",
      springerToilet: "",
      abbau: "",
      aufbau: "",
      awareness: "",
      tech: "",
    };
    if (initialSettings) {
      (Object.keys(initial) as RoleKey[]).forEach((role) => {
        const field = limitFieldNormalByRole[role];
        const value = initialSettings[field];
        initial[role] = value !== null && value !== undefined ? value.toString() : "";
      });
    }
    return initial;
  });
  const [limitValuesFastBunny, setLimitValuesFastBunny] = useState<Record<RoleKey, string>>(() => {
    const initial: Record<RoleKey, string> = {
      bar: "",
      kuechenhilfe: "",
      springerRunner: "",
      springerToilet: "",
      abbau: "",
      aufbau: "",
      awareness: "",
      tech: "",
    };
    if (initialSettings) {
      (Object.keys(initial) as RoleKey[]).forEach((role) => {
        const field = limitFieldFastBunnyByRole[role];
        const value = initialSettings[field];
        initial[role] = value !== null && value !== undefined ? value.toString() : "";
      });
    }
    return initial;
  });

  const [priceValues, setPriceValues] = useState<Record<`${RoleKey}_early` | `${RoleKey}_fast_bunny` | `${RoleKey}_normal`, string>>(() => {
    const initial: Record<`${RoleKey}_early` | `${RoleKey}_fast_bunny` | `${RoleKey}_normal`, string> = {
      bar_early: "",
      bar_fast_bunny: "",
      bar_normal: "",
      kuechenhilfe_early: "",
      kuechenhilfe_fast_bunny: "",
      kuechenhilfe_normal: "",
      springerRunner_early: "",
      springerRunner_fast_bunny: "",
      springerRunner_normal: "",
      springerToilet_early: "",
      springerToilet_fast_bunny: "",
      springerToilet_normal: "",
      abbau_early: "",
      abbau_fast_bunny: "",
      abbau_normal: "",
      aufbau_early: "",
      aufbau_fast_bunny: "",
      aufbau_normal: "",
      awareness_early: "",
      awareness_fast_bunny: "",
      awareness_normal: "",
      tech_early: "",
      tech_fast_bunny: "",
      tech_normal: "",
    };

    if (initialSettings) {
      (Object.keys(priceFieldByRole) as RoleKey[]).forEach((role) => {
        const fields = priceFieldByRole[role];
        const earlyVal = initialSettings[fields.early];
        const fastBunnyVal = initialSettings[fields.fastBunny];
        const normalVal = initialSettings[fields.normal];
        initial[`${role}_early`] = earlyVal !== null && earlyVal !== undefined ? earlyVal.toString() : "";
        initial[`${role}_fast_bunny`] = fastBunnyVal !== null && fastBunnyVal !== undefined ? fastBunnyVal.toString() : "";
        initial[`${role}_normal`] = normalVal !== null && normalVal !== undefined ? normalVal.toString() : "";
      });
    }

    return initial;
  });

  // Load remaining tickets per role and type (early / normal) from current saved limits
  useEffect(() => {
    let isMounted = true;

    async function loadRemainingTickets() {
      if (!initialSettings) return;

      const { getRemainingTickets } = await import('@/lib/ticketPurchases');

      const roles = Object.keys(limitFieldEarlyByRole) as RoleKey[];
      const entries = await Promise.all(
        roles.map(async (role) => {
          const limitEarly = initialSettings[limitFieldEarlyByRole[role]] as number | null | undefined;
          const limitNormal = initialSettings[limitFieldNormalByRole[role]] as number | null | undefined;
          const limitFastBunny = initialSettings[limitFieldFastBunnyByRole[role]] as number | null | undefined;
          try {
            const remaining = await getRemainingTickets(role, limitEarly, limitNormal, limitFastBunny);
            return [role, remaining] as const;
          } catch {
            return [role, { early: null, fastBunny: null, normal: null }] as const;
          }
        })
      );

      if (!isMounted) return;

      const next: Partial<Record<RoleKey, { early: number | null; fastBunny: number | null; normal: number | null }>> = {};
      entries.forEach(([role, remaining]) => {
        next[role] = remaining;
      });
      setRemainingByRole(next);
    }

    loadRemainingTickets();

    return () => {
      isMounted = false;
    };
  }, [initialSettings]);

  // Load remaining universal limits (Early Bird, Fast Bunny, Normal Bird)
  useEffect(() => {
    let isMounted = true;

    async function loadRemainingUniversal() {
      if (!initialSettings) return;

      const {
        getRemainingEarlyBirdTickets,
        getRemainingFastBunnyTickets,
        getRemainingNormalTickets,
      } = await import('@/lib/ticketPurchases');

      const earlyLimit = initialSettings.early_bird_total_limit ?? null;
      const fastBunnyLimit = initialSettings.fast_bunny_total_limit ?? null;
      const normalLimit = initialSettings.normal_total_limit ?? null;

      try {
        const [early, fastBunny, normal] = await Promise.all([
          getRemainingEarlyBirdTickets(earlyLimit),
          getRemainingFastBunnyTickets(fastBunnyLimit, earlyLimit),
          getRemainingNormalTickets(normalLimit),
        ]);

        if (!isMounted) return;
        setRemainingUniversal({ early, fastBunny, normal });
      } catch {
        if (!isMounted) return;
        setRemainingUniversal({ early: null, fastBunny: null, normal: null });
      }
    }

    loadRemainingUniversal();

    return () => {
      isMounted = false;
    };
  }, [initialSettings]);

  // Sync form state when initialSettings changes (e.g., after loading)
  useEffect(() => {
    if (initialSettings) {
      setEarlyBirdEnabled(initialSettings.early_bird_enabled ?? false);
      setEarlyBirdCutoff(formatDateTimeLocalFromIso(initialSettings.early_bird_cutoff ?? null));
      setFastBunnyEnabled(initialSettings.fast_bunny_enabled ?? false);
      setFastBunnyCutoff(formatDateTimeLocalFromIso(initialSettings.fast_bunny_cutoff ?? null));
      setEarlyBirdTotalLimit(
        initialSettings.early_bird_total_limit !== null && initialSettings.early_bird_total_limit !== undefined
          ? initialSettings.early_bird_total_limit.toString()
          : ""
      );
      setFastBunnyTotalLimit(
        initialSettings.fast_bunny_total_limit !== null && initialSettings.fast_bunny_total_limit !== undefined
          ? initialSettings.fast_bunny_total_limit.toString()
          : ""
      );
      setNormalTotalLimit(
        initialSettings.normal_total_limit !== null && initialSettings.normal_total_limit !== undefined
          ? initialSettings.normal_total_limit.toString()
          : ""
      );

      const newLimitValuesEarly: Record<RoleKey, string> = {
        bar: "", kuechenhilfe: "", springerRunner: "", springerToilet: "",
        abbau: "", aufbau: "", awareness: "", tech: "",
      };
      const newLimitValuesNormal: Record<RoleKey, string> = {
        bar: "", kuechenhilfe: "", springerRunner: "", springerToilet: "",
        abbau: "", aufbau: "", awareness: "", tech: "",
      };
      const newLimitValuesFastBunny: Record<RoleKey, string> = {
        bar: "", kuechenhilfe: "", springerRunner: "", springerToilet: "",
        abbau: "", aufbau: "", awareness: "", tech: "",
      };
      (Object.keys(newLimitValuesEarly) as RoleKey[]).forEach((role) => {
        const earlyVal = initialSettings[limitFieldEarlyByRole[role]];
        const normalVal = initialSettings[limitFieldNormalByRole[role]];
        const fastBunnyVal = initialSettings[limitFieldFastBunnyByRole[role]];
        newLimitValuesEarly[role] = earlyVal !== null && earlyVal !== undefined ? earlyVal.toString() : "";
        newLimitValuesNormal[role] = normalVal !== null && normalVal !== undefined ? normalVal.toString() : "";
        newLimitValuesFastBunny[role] = fastBunnyVal !== null && fastBunnyVal !== undefined ? fastBunnyVal.toString() : "";
      });
      setLimitValuesEarly(newLimitValuesEarly);
      setLimitValuesNormal(newLimitValuesNormal);
      setLimitValuesFastBunny(newLimitValuesFastBunny);

      // Update price values
      const newPriceValues: Record<`${RoleKey}_early` | `${RoleKey}_fast_bunny` | `${RoleKey}_normal`, string> = {
        bar_early: "", bar_fast_bunny: "", bar_normal: "",
        kuechenhilfe_early: "", kuechenhilfe_fast_bunny: "", kuechenhilfe_normal: "",
        springerRunner_early: "", springerRunner_fast_bunny: "", springerRunner_normal: "",
        springerToilet_early: "", springerToilet_fast_bunny: "", springerToilet_normal: "",
        abbau_early: "", abbau_fast_bunny: "", abbau_normal: "",
        aufbau_early: "", aufbau_fast_bunny: "", aufbau_normal: "",
        awareness_early: "", awareness_fast_bunny: "", awareness_normal: "",
        tech_early: "", tech_fast_bunny: "", tech_normal: "",
      };
      (Object.keys(priceFieldByRole) as RoleKey[]).forEach((role) => {
        const fields = priceFieldByRole[role];
        const earlyVal = initialSettings[fields.early];
        const fastBunnyVal = initialSettings[fields.fastBunny];
        const normalVal = initialSettings[fields.normal];
        newPriceValues[`${role}_early`] = earlyVal !== null && earlyVal !== undefined ? earlyVal.toString() : "";
        newPriceValues[`${role}_fast_bunny`] = fastBunnyVal !== null && fastBunnyVal !== undefined ? fastBunnyVal.toString() : "";
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
      fast_bunny_enabled: fastBunnyEnabled,
      fast_bunny_cutoff: fastBunnyCutoff ? new Date(fastBunnyCutoff).toISOString() : null,
      early_bird_total_limit: earlyBirdTotalLimit.trim()
        ? (() => {
            const parsed = parseInt(earlyBirdTotalLimit.trim(), 10);
            return !isNaN(parsed) && parsed >= 0 ? parsed : null;
          })()
        : null,
      fast_bunny_total_limit: fastBunnyTotalLimit.trim()
        ? (() => {
            const parsed = parseInt(fastBunnyTotalLimit.trim(), 10);
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

    // Limits by type (early / fast bunny / normal)
    (Object.keys(limitValuesEarly) as RoleKey[]).forEach((role) => {
      const earlyField = limitFieldEarlyByRole[role];
      const normalField = limitFieldNormalByRole[role];
      const fastBunnyField = limitFieldFastBunnyByRole[role];
      const rawEarly = limitValuesEarly[role]?.trim() || "";
      const rawNormal = limitValuesNormal[role]?.trim() || "";
      const rawFastBunny = limitValuesFastBunny[role]?.trim() || "";
      const parseLimit = (raw: string) => {
        if (raw === "") return null;
        const parsed = parseInt(raw, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
        return null;
      };
      (settings as any)[earlyField] = parseLimit(rawEarly);
      (settings as any)[normalField] = parseLimit(rawNormal);
      (settings as any)[fastBunnyField] = parseLimit(rawFastBunny);
    });

    // Prices - include all fields explicitly (even if null)
    (Object.keys(priceFieldByRole) as RoleKey[]).forEach((role) => {
      const fields = priceFieldByRole[role];
      const early = priceValues[`${role}_early`]?.trim() || "";
      const fastBunny = priceValues[`${role}_fast_bunny`]?.trim() || "";
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
      
      if (fastBunny === "") {
        (settings as any)[fields.fastBunny] = null;
      } else {
        const parsed = parseFloat(fastBunny);
        if (!isNaN(parsed) && parsed >= 0) {
          (settings as any)[fields.fastBunny] = parsed;
        } else {
          console.warn(`[TicketSettingsForm] Invalid fast bunny price for ${role}: "${fastBunny}", setting to null`);
          (settings as any)[fields.fastBunny] = null;
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

    // PayPal payment link
    const trimmedPaypalLink = paypalPaymentLink.trim();
    settings.paypal_payment_link = trimmedPaypalLink || null;

    // Log the aufbau limit specifically for debugging
    console.log('[TicketSettingsForm] Submitting settings:', {
      allLimitsEarly: limitValuesEarly,
      allLimitsNormal: limitValuesNormal,
    });

    onSave(settings);
  };

  // Calculate total of all role limits (early + fast bunny + normal per role)
  const roleLimitsTotal = useMemo(() => {
    const allRoles = [...standardRoles, ...reducedRoles];
    const values: number[] = [];

    allRoles.forEach((role) => {
      const earlyVal = limitValuesEarly[role.key]?.trim();
      const fastBunnyVal = limitValuesFastBunny[role.key]?.trim();
      const normalVal = limitValuesNormal[role.key]?.trim();
      const early = earlyVal ? parseInt(earlyVal, 10) : 0;
      const fastBunny = fastBunnyVal ? parseInt(fastBunnyVal, 10) : 0;
      const normal = normalVal ? parseInt(normalVal, 10) : 0;
      if (!isNaN(early) && early >= 0 && !isNaN(fastBunny) && fastBunny >= 0 && !isNaN(normal) && normal >= 0 && (early > 0 || fastBunny > 0 || normal > 0)) {
        values.push(early + fastBunny + normal);
      }
    });
    
    return {
      values,
      total: values.reduce((sum, val) => sum + val, 0),
      display: values.length > 0
        ? `${values.join(' + ')} = ${values.reduce((sum, val) => sum + val, 0)}`
        : null
    };
  }, [limitValuesEarly, limitValuesFastBunny, limitValuesNormal, standardRoles, reducedRoles]);

  const getTotalForRole = (roleKey: RoleKey): string => {
    const earlyVal = limitValuesEarly[roleKey]?.trim() ?? "";
    const fastBunnyVal = limitValuesFastBunny[roleKey]?.trim() ?? "";
    const normalVal = limitValuesNormal[roleKey]?.trim() ?? "";
    const early = earlyVal === "" ? 0 : parseInt(earlyVal, 10) || 0;
    const fastBunny = fastBunnyVal === "" ? 0 : parseInt(fastBunnyVal, 10) || 0;
    const normal = normalVal === "" ? 0 : parseInt(normalVal, 10) || 0;
    return String(early + fastBunny + normal);
  };

  const handleTotalChange = (roleKey: RoleKey, value: string) => {
    const total = value.trim() === "" ? null : parseInt(value.trim(), 10);
    if (total !== null && (isNaN(total) || total < 0)) return;
    const earlyVal = limitValuesEarly[roleKey]?.trim() ?? "";
    const fastBunnyVal = limitValuesFastBunny[roleKey]?.trim() ?? "";
    const early = earlyVal === "" ? 0 : parseInt(earlyVal, 10) || 0;
    const fastBunny = fastBunnyVal === "" ? 0 : parseInt(fastBunnyVal, 10) || 0;
    const newNormal = total === null ? "" : String(Math.max(0, total - early - fastBunny));
    setLimitValuesNormal((prev) => ({ ...prev, [roleKey]: newNormal }));
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            {remainingUniversal.early !== null && (
              <span className="text-xs font-medium text-primary block">
                {remainingUniversal.early} {t("remaining")}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {t("earlyBirdTotalLimitDesc")}
            </p>
          </div>
          {/* Fast Bunny Universal Limit */}
          <div className="space-y-2 p-4 bg-background rounded-lg border">
            <Label htmlFor="fast_bunny_total_limit" className="text-base font-semibold">
              {t("fastBunnyTotalLimit")}
            </Label>
            <Input
              id="fast_bunny_total_limit"
              type="number"
              min="0"
              value={fastBunnyTotalLimit}
              onChange={(e) => setFastBunnyTotalLimit(e.target.value)}
              placeholder={t("unlimited")}
              className="text-lg"
            />
            {remainingUniversal.fastBunny !== null && (
              <span className="text-xs font-medium text-primary block">
                {remainingUniversal.fastBunny} {t("remaining")}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {t("fastBunnyTotalLimitDesc")}
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
            {remainingUniversal.normal !== null && (
              <span className="text-xs font-medium text-primary block">
                {remainingUniversal.normal} {t("remaining")}
              </span>
            )}
            <p className="text-xs text-muted-foreground">
              {t("normalTotalLimitDesc")}
            </p>
          </div>
        </div>
      </div>

      {/* Early Bird & Fast Bunny Settings - side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Fast Bunny Settings */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">{t("fastBunnyTicketSettings")}</h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="fast_bunny_enabled">{t("enableFastBunnyTickets")}</Label>
            <p className="text-sm text-muted-foreground">
              {t("enableFastBunnyTicketsDesc")}
            </p>
          </div>
          <Switch
            id="fast_bunny_enabled"
            checked={fastBunnyEnabled}
            onCheckedChange={setFastBunnyEnabled}
          />
        </div>

        {fastBunnyEnabled && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fast_bunny_cutoff">{t("fastBunnyCutoffDate")}</Label>
              <Input
                id="fast_bunny_cutoff"
                type="datetime-local"
                value={fastBunnyCutoff}
                onChange={(e) => setFastBunnyCutoff(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {t("fastBunnyCutoffDesc")}
              </p>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Ticket Limits */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">{t("ticketAvailabilityLimits")}</h3>
          {roleLimitsTotal.display && (
            <div className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-md">
              {roleLimitsTotal.display}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t("setMaximumTickets")}
        </p>
        <div className="space-y-6">
          <div className="space-y-3">
            <h4 className="font-semibold">{t("standardTickets_plural")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {standardRoles.map((role) => {
                const remaining = remainingByRole[role.key];
                return (
                  <div key={role.key} className="space-y-3 p-3 rounded-lg border">
                    <div className="font-medium">{role.label} {t("limit")}</div>
                    <div className="space-y-1.5 mb-3">
                      <Label htmlFor={`${role.key}_limit_total`}>{t("totalAvailable")}</Label>
                      <Input
                        id={`${role.key}_limit_total`}
                        type="number"
                        min="0"
                        value={getTotalForRole(role.key)}
                        onChange={(e) => handleTotalChange(role.key, e.target.value)}
                        placeholder={t("unlimited")}
                      />
                      <p className="text-xs text-muted-foreground">{t("totalAvailableDesc")}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5 min-h-[4.5rem]">
                        <Label htmlFor={`${role.key}_limit_early`}>{t("earlyBird")}</Label>
                        {remaining !== undefined && remaining.early !== null && (
                          <span className="text-xs font-medium text-primary block">
                            {remaining.early} {t("remaining") ?? "remaining"}
                          </span>
                        )}
                        <Input
                          id={`${role.key}_limit_early`}
                          type="number"
                          min="0"
                          value={limitValuesEarly[role.key]}
                          onChange={(e) =>
                            setLimitValuesEarly((prev) => ({ ...prev, [role.key]: e.target.value }))
                          }
                          placeholder={t("unlimited")}
                        />
                      </div>
                      <div className="space-y-1.5 min-h-[4.5rem]">
                        <Label htmlFor={`${role.key}_limit_fast_bunny`}>{t("fastBunny")}</Label>
                        {remaining !== undefined && remaining.fastBunny !== null && (
                          <span className="text-xs font-medium text-primary block">
                            {remaining.fastBunny} {t("remaining") ?? "remaining"}
                          </span>
                        )}
                        <Input
                          id={`${role.key}_limit_fast_bunny`}
                          type="number"
                          min="0"
                          value={limitValuesFastBunny[role.key]}
                          onChange={(e) =>
                            setLimitValuesFastBunny((prev) => ({ ...prev, [role.key]: e.target.value }))
                          }
                          placeholder={t("unlimited")}
                        />
                      </div>
                      <div className="space-y-1.5 min-h-[4.5rem]">
                        <Label htmlFor={`${role.key}_limit_normal`}>{t("normal")}</Label>
                        {remaining !== undefined && remaining.normal !== null && (
                          <span className="text-xs font-medium text-primary block">
                            {remaining.normal} {t("remaining") ?? "remaining"}
                          </span>
                        )}
                        <Input
                          id={`${role.key}_limit_normal`}
                          type="number"
                          min="0"
                          value={limitValuesNormal[role.key]}
                          onChange={(e) =>
                            setLimitValuesNormal((prev) => ({ ...prev, [role.key]: e.target.value }))
                          }
                          placeholder={t("unlimited")}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">{t("reducedTickets_plural")}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reducedRoles.map((role) => {
                const remaining = remainingByRole[role.key];
                return (
                  <div key={role.key} className="space-y-3 p-3 rounded-lg border">
                    <div className="font-medium">{role.label} {t("limit")}</div>
                    <div className="space-y-1.5 mb-3">
                      <Label htmlFor={`${role.key}_limit_total_reduced`}>{t("totalAvailable")}</Label>
                      <Input
                        id={`${role.key}_limit_total_reduced`}
                        type="number"
                        min="0"
                        value={getTotalForRole(role.key)}
                        onChange={(e) => handleTotalChange(role.key, e.target.value)}
                        placeholder={t("unlimited")}
                      />
                      <p className="text-xs text-muted-foreground">{t("totalAvailableDesc")}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1.5 min-h-[4.5rem]">
                        <Label htmlFor={`${role.key}_limit_early_reduced`}>{t("earlyBird")}</Label>
                        {remaining !== undefined && remaining.early !== null && (
                          <span className="text-xs font-medium text-primary block">
                            {remaining.early} {t("remaining") ?? "remaining"}
                          </span>
                        )}
                        <Input
                          id={`${role.key}_limit_early_reduced`}
                          type="number"
                          min="0"
                          value={limitValuesEarly[role.key]}
                          onChange={(e) =>
                            setLimitValuesEarly((prev) => ({ ...prev, [role.key]: e.target.value }))
                          }
                          placeholder={t("unlimited")}
                        />
                      </div>
                      <div className="space-y-1.5 min-h-[4.5rem]">
                        <Label htmlFor={`${role.key}_limit_fast_bunny_reduced`}>{t("fastBunny")}</Label>
                        {remaining !== undefined && remaining.fastBunny !== null && (
                          <span className="text-xs font-medium text-primary block">
                            {remaining.fastBunny} {t("remaining") ?? "remaining"}
                          </span>
                        )}
                        <Input
                          id={`${role.key}_limit_fast_bunny_reduced`}
                          type="number"
                          min="0"
                          value={limitValuesFastBunny[role.key]}
                          onChange={(e) =>
                            setLimitValuesFastBunny((prev) => ({ ...prev, [role.key]: e.target.value }))
                          }
                          placeholder={t("unlimited")}
                        />
                      </div>
                      <div className="space-y-1.5 min-h-[4.5rem]">
                        <Label htmlFor={`${role.key}_limit_normal_reduced`}>{t("normal")}</Label>
                        {remaining !== undefined && remaining.normal !== null && (
                          <span className="text-xs font-medium text-primary block">
                            {remaining.normal} {t("remaining") ?? "remaining"}
                          </span>
                        )}
                        <Input
                          id={`${role.key}_limit_normal_reduced`}
                          type="number"
                          min="0"
                          value={limitValuesNormal[role.key]}
                          onChange={(e) =>
                            setLimitValuesNormal((prev) => ({ ...prev, [role.key]: e.target.value }))
                          }
                          placeholder={t("unlimited")}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                      <Label htmlFor={`${role.key}_price_fast_bunny`}>{t("fastBunnyPrice")}</Label>
                      <Input
                        id={`${role.key}_price_fast_bunny`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceValues[`${role.key}_fast_bunny`]}
                        onChange={(e) =>
                          setPriceValues((prev) => ({ ...prev, [`${role.key}_fast_bunny`]: e.target.value }))
                        }
                        placeholder="110.00"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`${role.key}_price_early_reduced`}>{t("earlyBirdPrice")}</Label>
                      <Input
                        id={`${role.key}_price_early_reduced`}
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
                      <Label htmlFor={`${role.key}_price_fast_bunny_reduced`}>{t("fastBunnyPrice")}</Label>
                      <Input
                        id={`${role.key}_price_fast_bunny_reduced`}
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceValues[`${role.key}_fast_bunny`]}
                        onChange={(e) =>
                          setPriceValues((prev) => ({ ...prev, [`${role.key}_fast_bunny`]: e.target.value }))
                        }
                        placeholder="110.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${role.key}_price_normal_reduced`}>{t("normalPrice")}</Label>
                      <Input
                        id={`${role.key}_price_normal_reduced`}
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

      {/* PayPal Payment Link */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold">{t("paypalPaymentLink") || "PayPal Payment Link"}</h3>
        <div className="space-y-2">
          <Label htmlFor="paypal_payment_link">{t("paypalLink") || "PayPal Link"}</Label>
          <Input
            id="paypal_payment_link"
            type="url"
            value={paypalPaymentLink}
            onChange={(e) => setPaypalPaymentLink(e.target.value)}
            placeholder="https://paypal.me/kollektivspinnen"
          />
          <p className="text-xs text-muted-foreground">
            {t("paypalLinkDescription") || "Enter the PayPal payment link URL. Must be from a trusted PayPal domain (paypal.com, paypal.me) and use HTTPS."}
          </p>
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
        description: formatSupabaseError(error) || t("failedToUploadPhoto"),
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
        description: formatSupabaseError(error) || t("failedToUpdatePhoto"),
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
        description: formatSupabaseError(error) || t("failedToDeletePhoto"),
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