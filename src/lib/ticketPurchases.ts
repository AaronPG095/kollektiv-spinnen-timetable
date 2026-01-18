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
 * Get the number of confirmed purchases for a specific role.
 * 
 * IMPORTANT: This counts ALL confirmed purchases for the role regardless of ticket type.
 * Role limits apply to the TOTAL count of confirmed purchases, combining:
 * - Early Bird tickets (earlyBird)
 * - Normal tickets (normal)
 * - Reduced Early Bird tickets (reducedEarlyBird)
 * - Reduced Normal tickets (reducedNormal)
 * 
 * For example, if bar_limit is 20, then the total of all confirmed bar tickets
 * (whether Early Bird or Normal) cannot exceed 20.
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
 * Check if a role has available tickets.
 * 
 * IMPORTANT: Role limits apply to ALL ticket types combined (Early Bird, Normal, Reduced Early Bird, Reduced Normal).
 * This function checks if the total count of confirmed purchases for the role (across all ticket types)
 * is below the specified limit.
 * 
 * @param role - The role to check availability for
 * @param limit - The maximum number of tickets allowed for this role (null/undefined = unlimited)
 * @returns true if tickets are available, false if sold out
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

  // Get current purchase count (counts all ticket types: earlyBird, normal, reducedEarlyBird, reducedNormal)
  const purchaseCount = await getRolePurchaseCount(role);

  // Check if there are remaining tickets
  return purchaseCount < limit;
};

/**
 * Get remaining tickets for a role.
 * 
 * IMPORTANT: Role limits apply to ALL ticket types combined (Early Bird, Normal, Reduced Early Bird, Reduced Normal).
 * This function calculates how many more tickets can be sold for the role by subtracting the total
 * count of confirmed purchases (across all ticket types) from the limit.
 * 
 * @param role - The role to check remaining tickets for
 * @param limit - The maximum number of tickets allowed for this role (null/undefined = unlimited)
 * @returns The number of remaining tickets, or null if unlimited
 */
export const getRemainingTickets = async (
  role: string,
  limit: number | null | undefined
): Promise<number | null> => {
  // If no limit set, return null (unlimited)
  if (limit === null || limit === undefined) {
    return null;
  }

  // Get current purchase count (counts ALL ticket types: earlyBird, normal, reducedEarlyBird, reducedNormal)
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
 * Validate that a purchase can be created for a role without exceeding limits.
 * This provides server-side validation before creating a purchase.
 * Note: Limits apply to ALL ticket types combined (Early Bird, Normal, Reduced Early Bird, Reduced Normal).
 * 
 * @param role - The role to validate
 * @param limit - The maximum number of tickets allowed for this role (null/undefined = unlimited)
 * @returns Object with isValid flag and optional error message
 */
export const validatePurchaseLimit = async (
  role: string,
  limit: number | null | undefined
): Promise<{ isValid: boolean; error?: string }> => {
  const isAvailable = await checkRoleAvailability(role, limit);
  
  if (!isAvailable) {
    const remaining = await getRemainingTickets(role, limit);
    return {
      isValid: false,
      error: `Role ${role} is sold out. ${remaining === 0 ? 'No tickets remaining.' : `Only ${remaining} ticket(s) remaining.`}`,
    };
  }
  
  return { isValid: true };
};

/**
 * Create a new ticket purchase.
 * 
 * IMPORTANT: Role limits apply to ALL ticket types combined. Before calling this function,
 * you should validate availability using checkRoleAvailability() or validatePurchaseLimit().
 * The purchase is created with status 'pending' and will be validated against limits
 * when it is confirmed (via database trigger).
 * 
 * @param purchaseData - The purchase data to create
 * @param validateLimit - Optional: if true, validates role limit before creating purchase (default: false)
 * @returns Object with success flag and optional purchase or error
 */
export const createTicketPurchase = async (
  purchaseData: CreatePurchaseData,
  validateLimit: boolean = false
): Promise<{ success: boolean; purchase?: TicketPurchase; error?: string }> => {
  try {
    // Optional: Validate role limit before creating purchase
    if (validateLimit) {
      // Get ticket settings to find the limit for this role
      const { getTicketSettings } = await import('@/lib/ticketSettings');
      const settings = await getTicketSettings();
      
      // Map role to limit field
      const limitFieldMap: Record<string, keyof typeof settings> = {
        bar: 'bar_limit',
        kuechenhilfe: 'kuechenhilfe_limit',
        springerRunner: 'springer_runner_limit',
        springerToilet: 'springer_toilet_limit',
        abbau: 'abbau_limit',
        aufbau: 'aufbau_limit',
        awareness: 'awareness_limit',
        schichtleitung: 'schichtleitung_limit',
      };
      
      const limitField = limitFieldMap[purchaseData.role];
      if (limitField) {
        const limit = settings[limitField] as number | null | undefined;
        const validation = await validatePurchaseLimit(purchaseData.role, limit);
        
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.error || 'Role limit exceeded',
          };
        }
      }
    }

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

