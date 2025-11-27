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
      setError(null);
      
      console.log('[useEvents] Attempting to load events from database...');
      
      // Query with explicit is_visible filter for public users
      // RLS policies should handle admin access, but we also filter client-side for safety
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_visible', true)
        .order('day', { ascending: true })
        .order('time', { ascending: true });

      if (error) {
        console.error('[useEvents] Supabase query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      console.log(`[useEvents] Successfully loaded ${data?.length || 0} events`);
      
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
        links: event.links ? JSON.parse(JSON.stringify(event.links)) : {},
        is_visible: event.is_visible
      }));

      setEvents(transformedEvents);
      setError(null);
    } catch (err: any) {
      console.error('[useEvents] Error loading events:', {
        error: err,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        stack: err?.stack
      });
      setError(err?.message || 'Failed to load events. Please check your connection and try again.');
      // Fallback to empty array if database fails
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test connection first
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id')
          .limit(1);
        
        if (error) {
          console.error('[useEvents] Initial connection test failed:', error);
        } else {
          console.log('[useEvents] Connection test successful');
        }
      } catch (err) {
        console.error('[useEvents] Connection test error:', err);
      }
    };
    
    testConnection();
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