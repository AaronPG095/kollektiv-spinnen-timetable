import { supabase } from '@/integrations/supabase/client';

export interface TicketSettings {
  id: string;
  early_bird_enabled: boolean;
  early_bird_cutoff: string | null;
  // Limits
  bar_limit: number | null;
  kuechenhilfe_limit: number | null;
  springer_runner_limit: number | null;
  springer_toilet_limit: number | null;
  abbau_limit: number | null;
  aufbau_limit: number | null;
  awareness_limit: number | null;
  schichtleitung_limit: number | null;
  tech_limit: number | null;
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
  created_at: string;
  updated_at: string;
}

const DEFAULT_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

export const getTicketSettings = async (): Promise<TicketSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('ticket_settings')
      .select('*')
      .eq('id', DEFAULT_SETTINGS_ID)
      .single();

    if (error) {
      console.error('[TicketSettings] Error loading settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[TicketSettings] Error loading settings:', error);
    return null;
  }
};

export const updateTicketSettings = async (settings: Partial<TicketSettings>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('ticket_settings')
      .upsert({
        id: DEFAULT_SETTINGS_ID,
        ...settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('[TicketSettings] Error updating settings:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[TicketSettings] Error updating settings:', error);
    return false;
  }
};

