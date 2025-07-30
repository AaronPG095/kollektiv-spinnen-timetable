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
import { Loader2, Plus, Edit, Trash2, LogOut } from 'lucide-react';

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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Events Management</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <EventForm onSave={handleSaveEvent} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-muted-foreground">
                      {event.day} • {event.time} • {event.venue} • {event.type}
                    </p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
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
  const [formData, setFormData] = useState({
    title: initialEvent?.title || '',
    time: initialEvent?.time || '',
    venue: initialEvent?.venue || '',
    day: initialEvent?.day || '',
    type: initialEvent?.type || '',
    description: initialEvent?.description || '',
    links: initialEvent?.links || {}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid grid-cols-3 gap-4">
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

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full">
        {initialEvent ? 'Update Event' : 'Create Event'}
      </Button>
    </form>
  );
};

export default Admin;