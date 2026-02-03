import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/components/EventCard';
import { cache } from '@/lib/cache';
import { logError } from '@/lib/errorHandler';
import { queryYearlyEvents, getCurrentYear, getEventsTableName } from '@/lib/yearEvents';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useEvents = (year?: number) => {
  const selectedYear = year ?? getCurrentYear();
  const CACHE_KEY = `events-${selectedYear}`;
  
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
          console.log(`[useEvents] Using cached events for year ${selectedYear}`);
        }
        setEvents(cached);
        setLoading(false);
        return;
      }

      if (import.meta.env.DEV) {
        console.log(`[useEvents] Loading events from database for year ${selectedYear}...`);
      }
      
      // Query from the appropriate yearly table
      const transformedEvents = await queryYearlyEvents(selectedYear, false);

      if (import.meta.env.DEV) {
        console.log(`[useEvents] Loaded ${transformedEvents.length} events for year ${selectedYear}`);
      }

      // Cache the transformed events
      cache.set(CACHE_KEY, transformedEvents, CACHE_TTL);

      setEvents(transformedEvents);
      setError(null);
    } catch (err: any) {
      logError('useEvents', err, { operation: 'loadEvents', year: selectedYear });
      setError(err?.message || 'Failed to load events. Please check your connection and try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();

    // Real-time subscription for event changes in the selected year's table
    const tableName = getEventsTableName(selectedYear);
    const channel = supabase
      .channel(`events-changes-${selectedYear}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName
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
  }, [selectedYear]);

  return { events, loading, error, refetch: loadEvents };
};
