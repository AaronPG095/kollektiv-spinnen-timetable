import { supabase } from '@/integrations/supabase/client';
import { Event } from '@/components/EventCard';
import { logError } from '@/lib/errorHandler';

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
 */
export async function getAvailableYears(): Promise<number[]> {
  try {
    const currentYear = getCurrentYear();
    const yearsToCheck: number[] = [];
    
    // Check years from 2020 to current year + 2
    for (let year = 2020; year <= currentYear + 2; year++) {
      yearsToCheck.push(year);
    }
    
    const availableYears: number[] = [];
    
    // Check each year by attempting to query the table
    // We'll use a simple count query to see if the table exists and has data
    for (const year of yearsToCheck) {
      try {
        const tableName = getEventsTableName(year);
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error && count !== null && count > 0) {
          availableYears.push(year);
        }
      } catch (err) {
        // Table doesn't exist or other error, skip this year
        if (import.meta.env.DEV) {
          console.log(`[yearEvents] Table events_${year} not available:`, err);
        }
      }
    }
    
    // If no years found, return at least current year
    if (availableYears.length === 0) {
      return [currentYear];
    }
    
    return availableYears.sort((a, b) => b - a); // Sort descending (newest first)
  } catch (error) {
    logError('yearEvents', error, { operation: 'getAvailableYears' });
    // Fallback to current year
    return [getCurrentYear()];
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
    const transformedEvents: Event[] = data.map(event => ({
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
      years: [year] // Single year since events are in yearly tables
    }));
    
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
