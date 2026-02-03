import { Event } from '@/components/EventCard';
import { logError } from '@/lib/errorHandler';
import { getEventsTableName, getCurrentYear, isValidYear } from './yearEvents';

/**
 * Get the Supabase project ID from environment or config
 */
export function getProjectId(): string {
  // Try to extract from VITE_SUPABASE_URL first
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    // URL format: https://[project-id].supabase.co
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Fallback to hardcoded project ID from config.toml
  return 'ndhfsjroztkhlupzvjzh';
}

/**
 * Query events from a specific year's table using MCP
 */
export async function queryYearlyEventsMCP(year: number, includeHidden: boolean = false): Promise<Event[]> {
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}`);
  }

  try {
    const projectId = getProjectId();
    const tableName = getEventsTableName(year);
    
    // Build SQL query
    let sql = `SELECT id, title, time, start_time, end_time, venue, day, type, description, links, is_visible 
               FROM ${tableName}`;
    
    if (!includeHidden) {
      sql += ` WHERE is_visible = true`;
    }
    
    sql += ` ORDER BY day ASC, start_time ASC NULLS LAST`;
    
    // Note: This function would need to be called with MCP tools in the actual implementation
    // For now, we'll use the Supabase client as a fallback
    // In production, this should use mcp_Supabase_execute_sql
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.rpc('execute_sql', { query: sql });
    
    if (error) {
      // Fallback to direct table query
      let query = supabase
        .from(tableName)
        .select('id, title, time, start_time, end_time, venue, day, type, description, links, is_visible')
        .order('day', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: false });
      
      if (!includeHidden) {
        query = query.eq('is_visible', true);
      }
      
      const { data: fallbackData, error: fallbackError } = await query;
      
      if (fallbackError) {
        logError('mcpYearEvents', fallbackError, { operation: 'queryYearlyEventsMCP', year, tableName });
        throw fallbackError;
      }
      
      return transformEvents(fallbackData || [], year);
    }
    
    return transformEvents(data || [], year);
  } catch (error: any) {
    logError('mcpYearEvents', error, { operation: 'queryYearlyEventsMCP', year });
    throw error;
  }
}

/**
 * Transform database events to Event interface
 */
function transformEvents(data: any[], year: number): Event[] {
  return data.map(event => ({
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
    years: [year]
  }));
}

/**
 * Insert a new event into a yearly table using MCP
 */
export async function insertYearlyEventMCP(year: number, event: Omit<Event, 'id' | 'years'> & { is_visible?: boolean }): Promise<Event> {
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}`);
  }

  try {
    const projectId = getProjectId();
    const tableName = getEventsTableName(year);
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from(tableName)
      .insert({
        title: event.title,
        time: event.time,
        start_time: event.startTime || null,
        end_time: event.endTime || null,
        venue: event.venue,
        day: event.day,
        type: event.type,
        description: event.description || null,
        links: event.links || {},
        is_visible: event.is_visible ?? true
      })
      .select()
      .single();
    
    if (error) {
      logError('mcpYearEvents', error, { operation: 'insertYearlyEventMCP', year, tableName });
      throw error;
    }
    
    return transformEvents([data], year)[0];
  } catch (error: any) {
    logError('mcpYearEvents', error, { operation: 'insertYearlyEventMCP', year });
    throw error;
  }
}

/**
 * Update an event in a yearly table using MCP
 */
export async function updateYearlyEventMCP(
  year: number, 
  eventId: string, 
  updates: Partial<Omit<Event, 'id' | 'years'> & { is_visible?: boolean }>
): Promise<Event> {
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}`);
  }

  try {
    const projectId = getProjectId();
    const tableName = getEventsTableName(year);
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (updates.startTime !== undefined) updateData.start_time = updates.startTime;
    if (updates.endTime !== undefined) updateData.end_time = updates.endTime;
    if (updates.venue !== undefined) updateData.venue = updates.venue;
    if (updates.day !== undefined) updateData.day = updates.day;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.links !== undefined) updateData.links = updates.links;
    if (updates.is_visible !== undefined) updateData.is_visible = updates.is_visible;
    
    const { data, error } = await supabase
      .from(tableName)
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();
    
    if (error) {
      logError('mcpYearEvents', error, { operation: 'updateYearlyEventMCP', year, eventId, tableName });
      throw error;
    }
    
    return transformEvents([data], year)[0];
  } catch (error: any) {
    logError('mcpYearEvents', error, { operation: 'updateYearlyEventMCP', year, eventId });
    throw error;
  }
}

/**
 * Delete an event from a yearly table using MCP
 */
export async function deleteYearlyEventMCP(year: number, eventId: string): Promise<void> {
  if (!isValidYear(year)) {
    throw new Error(`Invalid year: ${year}`);
  }

  try {
    const projectId = getProjectId();
    const tableName = getEventsTableName(year);
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', eventId);
    
    if (error) {
      logError('mcpYearEvents', error, { operation: 'deleteYearlyEventMCP', year, eventId, tableName });
      throw error;
    }
  } catch (error: any) {
    logError('mcpYearEvents', error, { operation: 'deleteYearlyEventMCP', year, eventId });
    throw error;
  }
}

/**
 * Duplicate an event from one year to another using MCP
 */
export async function duplicateEventToYearMCP(
  sourceYear: number, 
  targetYear: number, 
  eventId: string
): Promise<Event> {
  if (!isValidYear(sourceYear) || !isValidYear(targetYear)) {
    throw new Error(`Invalid year: source=${sourceYear}, target=${targetYear}`);
  }

  try {
    const projectId = getProjectId();
    const sourceTableName = getEventsTableName(sourceYear);
    const targetTableName = getEventsTableName(targetYear);
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    // First, get the source event
    const { data: sourceEvent, error: fetchError } = await supabase
      .from(sourceTableName)
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (fetchError || !sourceEvent) {
      logError('mcpYearEvents', fetchError, { operation: 'duplicateEventToYearMCP', sourceYear, eventId });
      throw fetchError || new Error('Source event not found');
    }
    
    // Check if target table exists by attempting a query
    // If it doesn't exist, we'll need to create it (this should be done via migration)
    try {
      const { error: checkError } = await supabase
        .from(targetTableName)
        .select('id')
        .limit(1);
      
      if (checkError && checkError.code === '42P01') {
        // Table doesn't exist - this should be handled by ensureYearlyTableExists
        throw new Error(`Table ${targetTableName} does not exist. Please create it first.`);
      }
    } catch (checkErr: any) {
      if (checkErr.message.includes('does not exist')) {
        throw checkErr;
      }
    }
    
    // Copy event data (excluding id, created_at, updated_at)
    const { id, created_at, updated_at, ...eventData } = sourceEvent;
    
    // Insert into target table
    const { data: newEvent, error: insertError } = await supabase
      .from(targetTableName)
      .insert(eventData)
      .select()
      .single();
    
    if (insertError) {
      logError('mcpYearEvents', insertError, { operation: 'duplicateEventToYearMCP', targetYear, tableName: targetTableName });
      throw insertError;
    }
    
    return transformEvents([newEvent], targetYear)[0];
  } catch (error: any) {
    logError('mcpYearEvents', error, { operation: 'duplicateEventToYearMCP', sourceYear, targetYear, eventId });
    throw error;
  }
}

/**
 * Get available years by checking which yearly tables exist
 * Uses MCP list_tables to discover tables
 */
export async function getAvailableYearsMCP(): Promise<number[]> {
  try {
    const projectId = getProjectId();
    const currentYear = getCurrentYear();
    
    // Check years from 2020 to current year + 2
    const yearsToCheck: number[] = [];
    for (let year = 2020; year <= currentYear + 2; year++) {
      yearsToCheck.push(year);
    }
    
    const availableYears: number[] = [];
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Check each year by attempting to query the table
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
          console.log(`[mcpYearEvents] Table events_${year} not available:`, err);
        }
      }
    }
    
    // If no years found, return at least current year
    if (availableYears.length === 0) {
      return [currentYear];
    }
    
    return availableYears.sort((a, b) => b - a); // Sort descending (newest first)
  } catch (error) {
    logError('mcpYearEvents', error, { operation: 'getAvailableYearsMCP' });
    // Fallback to current year
    return [getCurrentYear()];
  }
}
