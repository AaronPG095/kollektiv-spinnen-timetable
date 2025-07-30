import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/components/EventCard';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('day', { ascending: true })
        .order('time', { ascending: true });

      if (error) throw error;
      
      // Transform database events to match the Event interface
      const transformedEvents: Event[] = (data || []).map(event => ({
        id: event.id,
        title: event.title,
        time: event.time,
        startTime: event.start_time || event.time?.split(' - ')[0] || '',
        endTime: event.end_time || event.time?.split(' - ')[1] || '',
        venue: event.venue as "draussen" | "oben" | "unten",
        day: event.day as "Freitag" | "Samstag" | "Sonntag",
        type: event.type as "performance" | "dj" | "workshop" | "live" | "interaktiv",
        description: event.description || '',
        links: event.links ? JSON.parse(JSON.stringify(event.links)) : {}
      }));

      setEvents(transformedEvents);
      setError(null);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
      // Fallback to empty array if database fails
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Set up real-time subscription for events
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { events, loading, error, refetch: loadEvents };
};