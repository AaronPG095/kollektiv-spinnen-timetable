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
      console.log('[useEvents] Supabase client:', supabase ? 'initialized' : 'not initialized');
      
      // Query with explicit is_visible filter for public users
      // RLS policies should handle admin access, but we also filter client-side for safety
      console.log('[useEvents] Starting Supabase query...');
      const queryStartTime = Date.now();
      
      // Declare variables for query result
      let data: any = null;
      let error: any = null;
      
      // Try a direct REST API call first to test if the issue is with Supabase client
      console.log('[useEvents] Testing direct REST API call...');
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('[useEvents] Supabase URL:', SUPABASE_URL);
      console.log('[useEvents] Making direct fetch request...');
      
      const directFetchStart = Date.now();
      try {
        const restUrl = `${SUPABASE_URL}/rest/v1/events?select=*&apikey=${SUPABASE_KEY}`;
        console.log('[useEvents] REST URL:', restUrl);
        
        // Create timeout signal
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 10000);
        
        const directResponse = await fetch(restUrl, {
          method: 'GET',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          signal: abortController.signal
        });
        
        clearTimeout(timeoutId);
        
        const directFetchDuration = Date.now() - directFetchStart;
        console.log(`[useEvents] Direct fetch completed in ${directFetchDuration}ms, status: ${directResponse.status}`);
        
        if (!directResponse.ok) {
          const errorText = await directResponse.text();
          console.error('[useEvents] Direct fetch failed:', {
            status: directResponse.status,
            statusText: directResponse.statusText,
            body: errorText
          });
          throw new Error(`Direct fetch failed: ${directResponse.status} ${directResponse.statusText}`);
        }
        
        const directData = await directResponse.json();
        console.log(`[useEvents] Direct fetch successful, got ${directData.length} events`);
        
        // If direct fetch works, use that data
        data = directData;
        error = null;
      } catch (directError: any) {
        const directFetchDuration = Date.now() - directFetchStart;
        console.error(`[useEvents] Direct fetch failed after ${directFetchDuration}ms:`, directError);
        
        // Fall back to Supabase client if direct fetch fails
        console.log('[useEvents] Falling back to Supabase client...');
        const queryPromise = supabase
          .from('events')
          .select('*');
        
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Query timeout after 10 seconds'));
          }, 10000);
        });
        
        console.log('[useEvents] Query promise created, awaiting with timeout...');
        const result = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as { data: any; error: any };
        
        data = result.data;
        error = result.error;
      }
      
      console.log('[useEvents] Query resolved!');

      const basicQueryDuration = Date.now() - queryStartTime;
      console.log(`[useEvents] Basic query completed in ${basicQueryDuration}ms`, {
        dataCount: data?.length || 0,
        error: error ? { message: error.message, code: error.code } : null
      });

      // If basic query works, try with filters
      if (!error && data) {
        console.log('[useEvents] Basic query successful, now filtering by is_visible...');
        const filterStartTime = Date.now();
        
        // Filter client-side for now to avoid potential RLS issues
        const visibleEvents = data.filter(event => event.is_visible === true);
        
        // Sort the filtered results
        const sortedEvents = visibleEvents.sort((a, b) => {
          const dayOrder = { 'Freitag': 1, 'Samstag': 2, 'Sonntag': 3 };
          const dayCompare = (dayOrder[a.day as keyof typeof dayOrder] || 99) - (dayOrder[b.day as keyof typeof dayOrder] || 99);
          if (dayCompare !== 0) return dayCompare;
          
          // Sort by time if days are equal
          const timeA = a.time?.split(' - ')[0] || '';
          const timeB = b.time?.split(' - ')[0] || '';
          return timeA.localeCompare(timeB);
        });
        
        const filterDuration = Date.now() - filterStartTime;
        console.log(`[useEvents] Filtering completed in ${filterDuration}ms, found ${sortedEvents.length} visible events`);
        
        data = sortedEvents as typeof data;
      } else if (error) {
        console.error('[useEvents] Basic query failed, error:', error);
        throw error;
      }

      const queryDuration = Date.now() - queryStartTime;
      console.log(`[useEvents] Total query process completed in ${queryDuration}ms`);

      if (error) {
        console.error('[useEvents] Supabase query error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status: error.status,
          statusText: error.statusText
        });
        throw error;
      }
      
      console.log(`[useEvents] Query with is_visible filter returned ${data?.length || 0} events`);
      
      if (!data || data.length === 0) {
        console.warn('[useEvents] No events found. Possible reasons:');
        console.warn('  - Database table is empty');
        console.warn('  - All events have is_visible = false');
        console.warn('  - RLS policies are blocking access');
      }
      
      // Transform database events to match the Event interface
      console.log('[useEvents] Transforming events data...');
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
        is_visible: event.is_visible,
        year: Array.isArray(event.year) 
          ? event.year.filter(y => y != null) 
          : (event.year != null ? [event.year] : [])
      }));

      console.log(`[useEvents] Transformed ${transformedEvents.length} events, setting state...`);
      setEvents(transformedEvents);
      setError(null);
      console.log('[useEvents] Successfully loaded events');
    } catch (err: any) {
      console.error('[useEvents] Error loading events:', {
        error: err,
        message: err?.message,
        details: err?.details,
        hint: err?.hint,
        code: err?.code,
        status: err?.status,
        statusText: err?.statusText,
        stack: err?.stack
      });
      setError(err?.message || 'Failed to load events. Please check your connection and try again.');
      // Fallback to empty array if database fails
      setEvents([]);
      console.log('[useEvents] Set error state and empty events array');
    } finally {
      setLoading(false);
      console.log('[useEvents] Loading state set to false');
    }
  };

  useEffect(() => {
    console.log('[useEvents] useEffect triggered, initializing...');
    
    // Load events directly - connection test is redundant
    loadEvents();

    // Temporarily disable real-time subscription to test if it's causing issues
    // TODO: Re-enable after confirming query works
    /*
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
    */
  }, []);

  return { events, loading, error, refetch: loadEvents };
};