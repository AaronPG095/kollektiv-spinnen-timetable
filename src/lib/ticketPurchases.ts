import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError, logError } from '@/lib/errorHandler';

export interface TicketPurchase {
  id: string;
  user_id: string | null;
  ticket_type: 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal';
  role: string;
  price: number;
  purchaser_name: string;
  purchaser_email: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseData {
  ticket_type: 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal';
  role: string;
  price: number;
  purchaser_name: string;
  purchaser_email: string;
  payment_reference?: string;
  notes?: string;
}

/**
 * Get the number of confirmed purchases for a specific role
 */
export const getRolePurchaseCount = async (role: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('ticket_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)
      .eq('status', 'confirmed');

    if (error) {
      logError('TicketPurchases', error, { operation: 'getRolePurchaseCount', role });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getRolePurchaseCount', role });
    return 0;
  }
};

/**
 * Check if a role has available tickets
 */
export const checkRoleAvailability = async (
  role: string,
  limit: number | null | undefined
): Promise<boolean> => {
  // If no limit set, role is available
  if (limit === null || limit === undefined) {
    return true;
  }

  // If limit is 0, role is sold out
  if (limit === 0) {
    return false;
  }

  // Get current purchase count
  const purchaseCount = await getRolePurchaseCount(role);

  // Check if there are remaining tickets
  return purchaseCount < limit;
};

/**
 * Get remaining tickets for a role
 */
export const getRemainingTickets = async (
  role: string,
  limit: number | null | undefined
): Promise<number | null> => {
  // If no limit set, return null (unlimited)
  if (limit === null || limit === undefined) {
    return null;
  }

  // Get current purchase count (counts both early-bird and normal tickets)
  const purchaseCount = await getRolePurchaseCount(role);

  // Calculate remaining
  const remaining = limit - purchaseCount;
  return Math.max(0, remaining);
};

/**
 * Get the number of confirmed early-bird purchases (across all roles)
 */
export const getEarlyBirdPurchaseCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('ticket_purchases')
      .select('*', { count: 'exact', head: true })
      .in('ticket_type', ['earlyBird', 'reducedEarlyBird'])
      .eq('status', 'confirmed');

    if (error) {
      logError('TicketPurchases', error, { operation: 'getEarlyBirdPurchaseCount' });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getEarlyBirdPurchaseCount' });
    return 0;
  }
};

/**
 * Get remaining early-bird tickets
 */
export const getRemainingEarlyBirdTickets = async (
  totalLimit: number | null | undefined
): Promise<number | null> => {
  // If no limit set, return null (unlimited)
  if (totalLimit === null || totalLimit === undefined) {
    return null;
  }

  // Get current early-bird purchase count
  const purchaseCount = await getEarlyBirdPurchaseCount();

  // Calculate remaining
  const remaining = totalLimit - purchaseCount;
  return Math.max(0, remaining);
};

/**
 * Create a new ticket purchase
 */
export const createTicketPurchase = async (
  purchaseData: CreatePurchaseData
): Promise<{ success: boolean; purchase?: TicketPurchase; error?: string }> => {
  try {
    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('ticket_purchases')
      .insert({
        user_id: user?.id || null,
        ticket_type: purchaseData.ticket_type,
        role: purchaseData.role,
        price: purchaseData.price,
        purchaser_name: purchaseData.purchaser_name,
        purchaser_email: purchaseData.purchaser_email,
        payment_reference: purchaseData.payment_reference || null,
        notes: purchaseData.notes || null,
        status: 'pending', // Will be confirmed after payment
      })
      .select()
      .single();

    if (error) {
      logError('TicketPurchases', error, { operation: 'createTicketPurchase', purchaseData });
      return {
        success: false,
        error: formatSupabaseError(error),
      };
    }

    return {
      success: true,
      purchase: data,
    };
  } catch (error: any) {
    logError('TicketPurchases', error, { operation: 'createTicketPurchase', purchaseData });
    return {
      success: false,
      error: formatSupabaseError(error),
    };
  }
};

/**
 * Confirm a ticket purchase (after payment)
 */
export const confirmTicketPurchase = async (
  purchaseId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('ticket_purchases')
      .update({ status: 'confirmed' })
      .eq('id', purchaseId);

    if (error) {
      logError('TicketPurchases', error, { operation: 'confirmTicketPurchase', purchaseId });
      return {
        success: false,
        error: formatSupabaseError(error),
      };
    }

    return { success: true };
  } catch (error: any) {
    logError('TicketPurchases', error, { operation: 'confirmTicketPurchase', purchaseId });
    return {
      success: false,
      error: formatSupabaseError(error),
    };
  }
};

/**
 * Get user's purchases
 */
export const getUserPurchases = async (): Promise<TicketPurchase[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('ticket_purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logError('TicketPurchases', error, { operation: 'getUserPurchases' });
      throw new Error(formatSupabaseError(error));
    }

    return data || [];
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getUserPurchases' });
    throw error instanceof Error ? error : new Error(formatSupabaseError(error));
  }
};

/**
 * Get all purchases (admin only)
 */
export const getAllPurchases = async (): Promise<TicketPurchase[]> => {
  try {
    const { data, error } = await supabase
      .from('ticket_purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logError('TicketPurchases', error, { operation: 'getAllPurchases' });
      throw new Error(formatSupabaseError(error));
    }

    return data || [];
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getAllPurchases' });
    throw error instanceof Error ? error : new Error(formatSupabaseError(error));
  }
};

