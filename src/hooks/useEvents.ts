import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/components/EventCard';
import { cache } from '@/lib/cache';
import { logError } from '@/lib/errorHandler';

const CACHE_KEY = 'events';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first
      const cached = cache.get<Event[]>(CACHE_KEY);
      if (cached) {
        if (import.meta.env.DEV) {
          console.log('[useEvents] Using cached events');
        }
        setEvents(cached);
        setLoading(false);
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[useEvents] Loading events from database...');
      }
      
      // Query with server-side filtering for visible events and specific columns
      const { data, error: queryError } = await supabase
        .from('events')
        .select('id, title, time, start_time, end_time, venue, day, type, description, links, is_visible, years, year')
        .eq('is_visible', true)
        .order('day', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false });

      if (queryError) {
        logError('useEvents', queryError, { operation: 'loadEvents' });
        throw queryError;
      }

      if (!data || data.length === 0) {
        if (import.meta.env.DEV) {
          console.warn('[useEvents] No events found');
        }
        setEvents([]);
        setError(null);
        setLoading(false);
        return;
      }

      // Sort events by day and time
      const sortedEvents = [...data].sort((a, b) => {
        const dayOrder = { 'Freitag': 1, 'Samstag': 2, 'Sonntag': 3 };
        const dayCompare = (dayOrder[a.day as keyof typeof dayOrder] || 99) - (dayOrder[b.day as keyof typeof dayOrder] || 99);
        if (dayCompare !== 0) return dayCompare;
        
        // Sort by time if days are equal
        const timeA = a.start_time || a.time?.split(' - ')[0] || '';
        const timeB = b.start_time || b.time?.split(' - ')[0] || '';
        return timeA.localeCompare(timeB);
      });

      // Transform database events to match the Event interface
      const transformedEvents: Event[] = sortedEvents.map(event => ({
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
        is_visible: event.is_visible,
        // Handle both old format (year) and new format (years array) for backward compatibility
        years: Array.isArray(event.years) && event.years.length > 0
          ? event.years
          : (typeof (event as any).year === 'number' ? [(event as any).year] : undefined)
      }));

      // Cache the transformed events
      cache.set(CACHE_KEY, transformedEvents, CACHE_TTL);

      if (import.meta.env.DEV) {
        console.log(`[useEvents] Loaded ${transformedEvents.length} events`);
      }

      setEvents(transformedEvents);
      setError(null);
    } catch (err: any) {
      logError('useEvents', err, { operation: 'loadEvents' });
      setError(err?.message || 'Failed to load events. Please check your connection and try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Real-time subscription for event changes
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
          // Invalidate cache and reload events
          cache.delete(CACHE_KEY);
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
