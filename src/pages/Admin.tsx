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
import { Loader2, Plus, Edit, Trash2, LogOut, Search } from 'lucide-react';

interface DatabaseEvent {
  id: string;
  title: string;
  time: string;
  venue: string;
  day: string;
  type: string;
  description: string | null;
  links: any;
}

const Admin = () => {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<DatabaseEvent | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h2 className="text-lg md:text-xl font-semibold">Events Management</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="min-h-[44px]">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <EventForm onSave={handleSaveEvent} />
            </DialogContent>
          </Dialog>
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

        <div className="grid gap-4">
          {filteredEvents.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
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
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Event</DialogTitle>
                        </DialogHeader>
                        <EventForm 
                          onSave={handleSaveEvent} 
                          initialEvent={event}
                        />
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

  const initialDescriptions = parseDescription(initialEvent?.description);

  const [formData, setFormData] = useState({
    title: initialEvent?.title || '',
    time: initialEvent?.time || '',
    venue: initialEvent?.venue || '',
    day: initialEvent?.day || '',
    type: initialEvent?.type || '',
    description_en: initialDescriptions.en,
    description_de: initialDescriptions.de,
    links: initialEvent?.links || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine descriptions into JSON format
    const description = JSON.stringify({
      en: formData.description_en,
      de: formData.description_de
    });
    
    const { description_en, description_de, ...eventData } = formData;
    onSave({ ...eventData, description });
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
              <SelectItem value="Friday">Friday</SelectItem>
              <SelectItem value="Saturday">Saturday</SelectItem>
              <SelectItem value="Sunday">Sunday</SelectItem>
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

      <Button type="submit" className="w-full">
        {initialEvent ? 'Update Event' : 'Create Event'}
      </Button>
    </form>
  );
};

export default Admin;