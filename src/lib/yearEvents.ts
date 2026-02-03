import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/components/EventCard';
import { logError } from '@/lib/errorHandler';
import { cache } from '@/lib/cache';

/**
 * Get the table name for events of a given year
 */
export function getEventsTableName(year: number): string {
  return `events_${year}`;
}

/**
 * Get the current year
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Validate if a year is within a reasonable range
 */
export function isValidYear(year: number): boolean {
  const currentYear = getCurrentYear();
  return year >= 2020 && year <= currentYear + 10;
}

/**
 * Get all available years that have events tables
 * Queries the database to find which yearly tables exist and have data
 * Uses caching and parallel queries for optimal performance
 */
export async function getAvailableYears(): Promise<number[]> {
  const CACHE_KEY = 'available-years';
  const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  
  // Check cache first
  const cached = cache.get<number[]>(CACHE_KEY);
  if (cached) {
    if (import.meta.env.DEV) {
      console.log('[yearEvents] Using cached available years');
    }
    return cached;
  }

  try {
    const currentYear = getCurrentYear();
    const yearsToCheck: number[] = [];
    
    // Check years from 2020 to current year + 2
    for (let year = 2020; year <= currentYear + 2; year++) {
      yearsToCheck.push(year);
    }
    
    // Check all years in parallel for better performance
    const yearChecks = yearsToCheck.map(async (year) => {
      try {
        const tableName = getEventsTableName(year);
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error && count !== null && count > 0) {
          return year;
        }
        return null;
      } catch (err) {
        // Table doesn't exist or other error, skip this year
        if (import.meta.env.DEV) {
          console.log(`[yearEvents] Table events_${year} not available:`, err);
        }
        return null;
      }
    });
    
    // Wait for all queries to complete in parallel
    const results = await Promise.all(yearChecks);
    
    // Filter out null values and get available years
    const availableYears = results.filter((year): year is number => year !== null);
    
    // If no years found, return at least current year
    const finalYears = availableYears.length === 0 
      ? [currentYear] 
      : availableYears.sort((a, b) => b - a); // Sort descending (newest first)
    
    // Cache the result
    cache.set(CACHE_KEY, finalYears, CACHE_TTL);
    
    return finalYears;
  } catch (error) {
    logError('yearEvents', error, { operation: 'getAvailableYears' });
    // Fallback to current year
    const fallback = [getCurrentYear()];
    cache.set(CACHE_KEY, fallback, CACHE_TTL);
    return fallback;
  }
}

/**
 * Query events from a specific year's table using Supabase client
 */
export async function queryYearlyEvents(year: number, includeHidden: boolean = false): Promise<Event[]> {
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}`);
  }

  try {
    const tableName = getEventsTableName(year);
    let query = supabase
      .from(tableName)
      .select('id, title, time, start_time, end_time, venue, day, type, description, links, is_visible')
      .order('day', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: false });
    
    if (!includeHidden) {
      query = query.eq('is_visible', true);
    }
    
    const { data, error } = await query;
    
    if (error) {
      logError('yearEvents', error, { operation: 'queryYearlyEvents', year, tableName });
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Transform database events to match the Event interface
    const transformedEvents: Event[] = data.map(event => {
      // Ensure startTime and endTime are always available
      const startTime = event.start_time || event.time?.split(' - ')[0] || '';
      const endTime = event.end_time || event.time?.split(' - ')[1] || '';
      
      // Construct time field from start_time and end_time if time is null
      const time = event.time || (startTime && endTime ? `${startTime} - ${endTime}` : '');
      
      return {
        id: event.id,
        title: event.title,
        time: time,
        startTime: startTime,
        endTime: endTime,
        venue: event.venue as "draussen" | "oben" | "unten",
        day: event.day as "Freitag" | "Samstag" | "Sonntag",
        type: event.type as "performance" | "dj" | "workshop" | "live" | "interaktiv",
        description: event.description || '',
        links: event.links ? JSON.parse(JSON.stringify(event.links)) : {},
        is_visible: event.is_visible,
        years: [year] // Single year since events are in yearly tables
      };
    });
    
    return transformedEvents;
  } catch (error: any) {
    logError('yearEvents', error, { operation: 'queryYearlyEvents', year });
    throw error;
  }
}

/**
 * Query events from all yearly tables
 * Returns events with their year information
 */
export async function queryAllYearlyEvents(includeHidden: boolean = false): Promise<(Event & { year: number })[]> {
  try {
    const availableYears = await getAvailableYears();
    const allEvents: (Event & { year: number })[] = [];
    
    for (const year of availableYears) {
      try {
        const events = await queryYearlyEvents(year, includeHidden);
        const eventsWithYear = events.map(event => ({ ...event, year }));
        allEvents.push(...eventsWithYear);
      } catch (error) {
        logError('yearEvents', error, { operation: 'queryAllYearlyEvents', year });
        // Continue with other years even if one fails
      }
    }
    
    return allEvents;
  } catch (error) {
    logError('yearEvents', error, { operation: 'queryAllYearlyEvents' });
    throw error;
  }
}
