import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
}

const Admin = () => {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
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
        title: "Access Denied",
        description: "You don't have admin permissions.",
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
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('day', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load FAQs",
        variant: "destructive",
      });
    }
  };

  const handleSaveEvent = async (eventData: Omit<DatabaseEvent, 'id'>) => {
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);
        
        if (error) throw error;
        toast({ title: "Event updated successfully" });
      } else {
        const { error } = await supabase
          .from('events')
          .insert([eventData]);
        
        if (error) throw error;
        toast({ title: "Event created successfully" });
      }
      
      loadEvents();
      setEditingEvent(null);
      setIsCreateOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Event deleted successfully" });
      loadEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_visible: !currentVisibility })
        .eq('id', id);
      
      if (error) throw error;
      toast({ 
        title: currentVisibility ? "Event hidden from public" : "Event made visible to public" 
      });
      loadEvents();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event visibility",
        variant: "destructive",
      });
    }
  };

  const handleSaveFAQ = async (faqData: Omit<FAQItem, 'id'>) => {
    try {
      if (editingFAQ) {
        const { error } = await supabase
          .from('faqs')
          .update(faqData)
          .eq('id', editingFAQ.id);
        
        if (error) throw error;
        toast({ title: "FAQ updated successfully" });
      } else {
        const { error } = await supabase
          .from('faqs')
          .insert([faqData]);
        
        if (error) throw error;
        toast({ title: "FAQ created successfully" });
      }
      
      loadFAQs();
      setEditingFAQ(null);
      setIsFAQCreateOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save FAQ",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      const { error } = await supabase
        .from('faqs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "FAQ deleted successfully" });
      loadFAQs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive",
      });
    }
  };

  const handleToggleFAQVisibility = async (id: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_visible: !currentVisibility })
        .eq('id', id);
      
      if (error) throw error;
      toast({ 
        title: currentVisibility ? "FAQ hidden from public" : "FAQ made visible to public" 
      });
      loadFAQs();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update FAQ visibility",
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
    <div className="min-h-screen bg-background p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Festival
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={activeTab === "events" ? "default" : "ghost"}
              onClick={() => setActiveTab("events")}
              className="flex-1 gap-2"
            >
              <Calendar className="h-4 w-4" />
              Events
            </Button>
            <Button
              variant={activeTab === "faqs" ? "default" : "ghost"}
              onClick={() => setActiveTab("faqs")}
              className="flex-1 gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              FAQs
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {activeTab === "events" ? "Events Management" : "FAQ Management"}
          </h2>
          <div className="flex gap-2">
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
        <div className="mb-6">
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
            <p className="text-sm text-muted-foreground mt-2">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          )}
        </div>

        {activeTab === "events" ? (
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <Card key={event.id} className={event.is_visible === false ? "border-destructive/50 bg-destructive/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{event.title}</h3>
                        {event.is_visible === false && (
                          <div className="flex items-center text-destructive text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {event.day} • {event.time} • {event.venue} • {event.type}
                      </p>
                      {event.description && (
                        <div className="text-sm text-muted-foreground mt-1">
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
                    <div className="flex gap-2">
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
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {faqs.map((faq) => (
              <Card key={faq.id} className={faq.is_visible === false ? "border-destructive/50 bg-destructive/5" : ""}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{faq.question}</h3>
                        {faq.is_visible === false && (
                          <div className="flex items-center text-destructive text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </div>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Order: {faq.order_index}
                      </p>
                      <div className="text-sm text-muted-foreground mt-2">
                        {faq.answer}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={faq.is_visible === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleFAQVisibility(faq.id, faq.is_visible !== false)}
                        title={faq.is_visible === false ? "Make visible to public" : "Hide from public"}
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
                            <DialogTitle>Edit FAQ</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-[75vh] overflow-y-auto pr-2">
                            <FAQForm 
                              onSave={handleSaveFAQ} 
                              initialFAQ={faq}
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
            ))}
          </div>
        )}
      </div>
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