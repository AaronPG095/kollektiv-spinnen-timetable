import { supabase } from '@/integrations/supabase/client';
import { cache } from '@/lib/cache';
import { formatSupabaseError, logError } from '@/lib/errorHandler';

export interface TicketSettings {
  id: string;
  early_bird_enabled: boolean;
  early_bird_cutoff: string | null;
  early_bird_total_limit: number | null;
  fast_bunny_enabled: boolean;
  fast_bunny_cutoff: string | null;
  fast_bunny_total_limit: number | null;
  normal_total_limit: number | null;
  total_soli_limit: number | null;
  // Limits (legacy single limit kept for backward compat; enforcement uses _early/_normal)
  bar_limit: number | null;
  kuechenhilfe_limit: number | null;
  springer_runner_limit: number | null;
  springer_toilet_limit: number | null;
  abbau_limit: number | null;
  aufbau_limit: number | null;
  awareness_limit: number | null;
  schichtleitung_limit: number | null;
  tech_limit: number | null;
  // Limits by ticket type (Early Bird / Normal Bird)
  bar_limit_early: number | null;
  bar_limit_normal: number | null;
  kuechenhilfe_limit_early: number | null;
  kuechenhilfe_limit_normal: number | null;
  springer_runner_limit_early: number | null;
  springer_runner_limit_normal: number | null;
  springer_toilet_limit_early: number | null;
  springer_toilet_limit_normal: number | null;
  abbau_limit_early: number | null;
  abbau_limit_normal: number | null;
  aufbau_limit_early: number | null;
  aufbau_limit_normal: number | null;
  awareness_limit_early: number | null;
  awareness_limit_normal: number | null;
  schichtleitung_limit_early: number | null;
  schichtleitung_limit_normal: number | null;
  tech_limit_early: number | null;
  tech_limit_normal: number | null;
  bar_limit_fast_bunny: number | null;
  kuechenhilfe_limit_fast_bunny: number | null;
  springer_runner_limit_fast_bunny: number | null;
  springer_toilet_limit_fast_bunny: number | null;
  abbau_limit_fast_bunny: number | null;
  aufbau_limit_fast_bunny: number | null;
  awareness_limit_fast_bunny: number | null;
  schichtleitung_limit_fast_bunny: number | null;
  tech_limit_fast_bunny: number | null;
  // Prices
  bar_price_early: number | null;
  bar_price_normal: number | null;
  kuechenhilfe_price_early: number | null;
  kuechenhilfe_price_normal: number | null;
  springer_runner_price_early: number | null;
  springer_runner_price_normal: number | null;
  springer_toilet_price_early: number | null;
  springer_toilet_price_normal: number | null;
  abbau_price_early: number | null;
  abbau_price_normal: number | null;
  aufbau_price_early: number | null;
  aufbau_price_normal: number | null;
  awareness_price_early: number | null;
  awareness_price_normal: number | null;
  schichtleitung_price_early: number | null;
  schichtleitung_price_normal: number | null;
  tech_price_early: number | null;
  tech_price_normal: number | null;
  bar_price_fast_bunny: number | null;
  kuechenhilfe_price_fast_bunny: number | null;
  springer_runner_price_fast_bunny: number | null;
  springer_toilet_price_fast_bunny: number | null;
  abbau_price_fast_bunny: number | null;
  aufbau_price_fast_bunny: number | null;
  awareness_price_fast_bunny: number | null;
  schichtleitung_price_fast_bunny: number | null;
  tech_price_fast_bunny: number | null;
  paypal_payment_link: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

const CACHE_KEY = 'soli_contribution_settings';
const CACHE_TTL = 30000; // 30 seconds

export const getTicketSettings = async (): Promise<TicketSettings> => {
  try {
    // Check cache first
    const cached = cache.get<TicketSettings>(CACHE_KEY);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('soli_contribution_settings')
      .select('*')
      .eq('id', DEFAULT_SETTINGS_ID)
      .single();

    if (error) {
      logError('TicketSettings', error, { operation: 'getTicketSettings' });
      // If row doesn't exist, try to create it
      if (error.code === 'PGRST116') {
        console.log('[TicketSettings] Default row not found, attempting to create...');
        const { data: inserted, error: insertError } = await supabase
          .from('soli_contribution_settings')
          .insert({ id: DEFAULT_SETTINGS_ID })
          .select()
          .single();

        if (insertError) {
          logError('TicketSettings', insertError, { operation: 'insertDefaultSettings' });
          // If insert fails due to conflict (row was created between check and insert), try to fetch again
          if (insertError.code === '23505') {
            const { data: retryData, error: retryError } = await supabase
              .from('soli_contribution_settings')
              .select('*')
              .eq('id', DEFAULT_SETTINGS_ID)
              .single();
            
            if (!retryError && retryData) {
              cache.set(CACHE_KEY, retryData, CACHE_TTL);
              return retryData;
            }
          }
          throw new Error(formatSupabaseError(insertError));
        }

        if (inserted) {
          cache.set(CACHE_KEY, inserted, CACHE_TTL);
          return inserted;
        }
        throw new Error('Failed to create default ticket settings');
      }
      throw new Error(formatSupabaseError(error));
    }

    // If no data returned, attempt to insert the default row once
    if (!data) {
      console.log('[TicketSettings] Default row not found, attempting to create...');
      const { data: inserted, error: insertError } = await supabase
        .from('soli_contribution_settings')
        .insert({ id: DEFAULT_SETTINGS_ID })
        .select()
        .single();

      if (insertError) {
        logError('TicketSettings', insertError, { operation: 'insertDefaultSettings' });
        // If insert fails due to conflict (row was created between check and insert), try to fetch again
        if (insertError.code === '23505') {
          const { data: retryData, error: retryError } = await supabase
            .from('soli_contribution_settings')
            .select('*')
            .eq('id', DEFAULT_SETTINGS_ID)
            .single();
          
          if (!retryError && retryData) {
            cache.set(CACHE_KEY, retryData, CACHE_TTL);
            return retryData;
          }
        }
        throw new Error(formatSupabaseError(insertError));
      }

      if (!inserted) {
        throw new Error('Failed to create default ticket settings');
      }

      cache.set(CACHE_KEY, inserted, CACHE_TTL);
      return inserted;
    }

    // Cache the result
    cache.set(CACHE_KEY, data, CACHE_TTL);
    return data;
  } catch (error) {
    logError('TicketSettings', error, { operation: 'getTicketSettings' });
    throw error instanceof Error ? error : new Error(formatSupabaseError(error));
  }
};

export const updateTicketSettings = async (settings: Partial<TicketSettings>): Promise<{ success: boolean; error?: string }> => {
  try {
    // Remove updated_at and id from settings since trigger handles updated_at and we'll set id explicitly
    const { updated_at, id, ...settingsWithoutTimestamp } = settings;
    
    // Filter out undefined values to avoid schema cache issues
    // Only include properties that are explicitly set (not undefined)
    const settingsToUpdate = Object.entries(settingsWithoutTimestamp).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // If no settings to update, return success
    if (Object.keys(settingsToUpdate).length === 0) {
      return { success: true };
    }
    
    // First, try to UPDATE the existing row
    const updateResponse = await supabase
      .from('soli_contribution_settings')
      .update(settingsToUpdate)
      .eq('id', DEFAULT_SETTINGS_ID)
      .select()
      .single();

    const { data: updateData, error: updateError, status: updateStatus } = updateResponse;

    // If update succeeds, we're done
    if (!updateError && updateData) {
      // Clear cache and set new data
      cache.delete(CACHE_KEY);
      cache.set(CACHE_KEY, updateData, CACHE_TTL);
      return { success: true };
    }

    // If update failed and we got no data, the row likely doesn't exist - try INSERT
    // This handles cases where error object has undefined properties (404 responses)
    const shouldTryInsert = !updateData && (
      updateError?.code === 'PGRST116' ||
      updateStatus === 404 ||
      (updateError && !updateError.message && !updateError.code)
    );

    if (shouldTryInsert) {
      const { data: insertData, error: insertError, status: insertStatus } = await supabase
        .from('soli_contribution_settings')
        .insert({
          id: DEFAULT_SETTINGS_ID,
          ...settingsToUpdate,
        })
        .select()
        .single();

      if (insertError) {
        logError('TicketSettings', insertError, { operation: 'insertSettings', status: insertStatus });
        const errorMessage = formatSupabaseError(insertError);
        return {
          success: false,
          error: errorMessage,
        };
      }

      if (insertData) {
        // Clear cache and set new data
        cache.delete(CACHE_KEY);
        cache.set(CACHE_KEY, insertData, CACHE_TTL);
        return { success: true };
      }
    }

    // If update failed for another reason, return the error
    logError('TicketSettings', updateError, { operation: 'updateSettings', status: updateStatus });
    const errorMessage = formatSupabaseError(updateError);
    
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error: any) {
    logError('TicketSettings', error, { operation: 'updateTicketSettings' });
    return { 
      success: false, 
      error: formatSupabaseError(error)
    };
  }
};

