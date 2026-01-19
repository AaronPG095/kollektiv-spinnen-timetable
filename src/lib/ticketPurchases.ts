import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError, logError } from '@/lib/errorHandler';

export interface TicketPurchase {
  id: string;
  user_id: string | null;
  contribution_type: 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal';
  role: string;
  price: number;
  purchaser_name: string;
  purchaser_email: string;
  status: 'confirmed' | 'cancelled';
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  checked: boolean;
}

export interface CreatePurchaseData {
  contribution_type: 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal';
  role: string;
  price: number;
  purchaser_name: string;
  purchaser_email: string;
  payment_reference?: string;
  notes?: string;
  status?: 'confirmed' | 'cancelled';
}

/**
 * Get the number of confirmed Soli-Contributions for a specific role.
 * 
 * IMPORTANT: This counts ALL confirmed Soli-Contributions for the role regardless of contribution type.
 * Role limits apply to the TOTAL count of confirmed Soli-Contributions, combining:
 * - Early Bird contributions (earlyBird)
 * - Normal contributions (normal)
 * - Reduced Early Bird contributions (reducedEarlyBird)
 * - Reduced Normal contributions (reducedNormal)
 * 
 * For example, if bar_limit is 20, then the total of all confirmed bar contributions
 * (whether Early Bird or Normal) cannot exceed 20.
 */
export const getRolePurchaseCount = async (role: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('soli_contribution_purchases')
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
 * Check if a role has available contributions.
 * 
 * IMPORTANT: Role limits apply to ALL contribution types combined (Early Bird, Normal, Reduced Early Bird, Reduced Normal).
 * This function checks if the total count of confirmed Soli-Contributions for the role (across all contribution types)
 * is below the specified limit.
 * 
 * @param role - The role to check availability for
 * @param limit - The maximum number of contributions allowed for this role (null/undefined = unlimited)
 * @returns true if contributions are available, false if sold out
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

  // Get current confirmed Soli-Contributions count (counts all contribution types: earlyBird, normal, reducedEarlyBird, reducedNormal)
  const purchaseCount = await getRolePurchaseCount(role);

  // Check if there are remaining contributions
  return purchaseCount < limit;
};

/**
 * Get remaining contributions for a role.
 * 
 * IMPORTANT: Role limits apply to ALL contribution types combined (Early Bird, Normal, Reduced Early Bird, Reduced Normal).
 * This function calculates how many more Soli-Contributions can be made for the role by subtracting the total
 * count of confirmed Soli-Contributions (across all contribution types) from the limit.
 * 
 * @param role - The role to check remaining contributions for
 * @param limit - The maximum number of contributions allowed for this role (null/undefined = unlimited)
 * @returns The number of remaining contributions, or null if unlimited
 */
export const getRemainingTickets = async (
  role: string,
  limit: number | null | undefined
): Promise<number | null> => {
  // If no limit set, return null (unlimited)
  if (limit === null || limit === undefined) {
    return null;
  }

  // Get current confirmed Soli-Contributions count (counts ALL contribution types: earlyBird, normal, reducedEarlyBird, reducedNormal)
  const purchaseCount = await getRolePurchaseCount(role);

  // Calculate remaining
  const remaining = limit - purchaseCount;
  return Math.max(0, remaining);
};

/**
 * Get the number of confirmed early-bird Soli-Contributions (across all roles)
 */
export const getEarlyBirdPurchaseCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('soli_contribution_purchases')
      .select('*', { count: 'exact', head: true })
      .in('contribution_type', ['earlyBird', 'reducedEarlyBird'])
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
 * Get remaining early-bird Soli-Contributions
 */
export const getRemainingEarlyBirdTickets = async (
  totalLimit: number | null | undefined
): Promise<number | null> => {
  // If no limit set, return null (unlimited)
  if (totalLimit === null || totalLimit === undefined) {
    return null;
  }

  // Get current early-bird confirmed Soli-Contributions count
  const purchaseCount = await getEarlyBirdPurchaseCount();

  // Calculate remaining
  const remaining = totalLimit - purchaseCount;
  return Math.max(0, remaining);
};

/**
 * Get the number of confirmed normal Soli-Contributions (across all roles)
 */
export const getNormalPurchaseCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('soli_contribution_purchases')
      .select('*', { count: 'exact', head: true })
      .in('contribution_type', ['normal', 'reducedNormal'])
      .eq('status', 'confirmed');

    if (error) {
      logError('TicketPurchases', error, { operation: 'getNormalPurchaseCount' });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getNormalPurchaseCount' });
    return 0;
  }
};

/**
 * Get remaining normal-bird Soli-Contributions
 */
export const getRemainingNormalTickets = async (
  totalLimit: number | null | undefined
): Promise<number | null> => {
  // If no limit set, return null (unlimited)
  if (totalLimit === null || totalLimit === undefined) {
    return null;
  }

  // Get current normal confirmed Soli-Contributions count
  const purchaseCount = await getNormalPurchaseCount();

  // Calculate remaining
  const remaining = totalLimit - purchaseCount;
  return Math.max(0, remaining);
};

/**
 * Validate that a Soli-Contribution can be created for a role without exceeding limits.
 * This provides server-side validation before creating a Soli-Contribution.
 * Note: Limits apply to ALL contribution types combined (Early Bird, Normal, Reduced Early Bird, Reduced Normal).
 * 
 * @param role - The role to validate
 * @param limit - The maximum number of contributions allowed for this role (null/undefined = unlimited)
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
      error: `Role ${role} is sold out. ${remaining === 0 ? 'No Soli-Contributions remaining.' : `Only ${remaining} Soli-Contribution(s) remaining.`}`,
    };
  }
  
  return { isValid: true };
};

/**
 * Create a new Soli-Contribution purchase.
 * 
 * IMPORTANT: Role limits apply to ALL contribution types combined. Before calling this function,
 * you should validate availability using checkRoleAvailability() or validatePurchaseLimit().
 * The Soli-Contribution is created with status 'confirmed' and will be validated against limits
 * immediately (via database trigger).
 * 
 * @param purchaseData - The Soli-Contribution data to create
 * @param validateLimit - Optional: if true, validates role limit before creating Soli-Contribution (default: false)
 * @returns Object with success flag and optional purchase or error
 */
export const createTicketPurchase = async (
  purchaseData: CreatePurchaseData,
  validateLimit: boolean = false
): Promise<{ success: boolean; purchase?: TicketPurchase; error?: string }> => {
  try {
    // Always validate universal limits (early_bird_total_limit and normal_total_limit)
    const { getTicketSettings } = await import('@/lib/ticketSettings');
    const settings = await getTicketSettings();
    
    // Check universal limits based on ticket type
    const isEarlyBird = purchaseData.contribution_type === 'earlyBird' || purchaseData.contribution_type === 'reducedEarlyBird';
    const isNormal = purchaseData.contribution_type === 'normal' || purchaseData.contribution_type === 'reducedNormal';
    
    if (isEarlyBird && settings.early_bird_total_limit !== null && settings.early_bird_total_limit !== undefined) {
      const remaining = await getRemainingEarlyBirdTickets(settings.early_bird_total_limit);
      if (remaining !== null && remaining <= 0) {
        return {
          success: false,
          error: 'Early-Bird tickets are sold out. The universal limit has been reached.',
        };
      }
    }
    
    if (isNormal && settings.normal_total_limit !== null && settings.normal_total_limit !== undefined) {
      const remaining = await getRemainingNormalTickets(settings.normal_total_limit);
      if (remaining !== null && remaining <= 0) {
        return {
          success: false,
          error: 'Normal Bird tickets are sold out. The universal limit has been reached.',
        };
      }
    }
    
    // Optional: Validate role limit before creating purchase
    if (validateLimit) {
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
      .from('soli_contribution_purchases')
      .insert({
        user_id: user?.id || null,
        contribution_type: purchaseData.contribution_type,
        role: purchaseData.role,
        price: purchaseData.price,
        purchaser_name: purchaseData.purchaser_name,
        purchaser_email: purchaseData.purchaser_email,
        payment_reference: purchaseData.payment_reference || null,
        notes: purchaseData.notes || null,
        status: purchaseData.status || 'confirmed', // Always 'confirmed' for new purchases
        checked: false, // New purchases appear in "Pending Soli-Contributions" tab
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
 * Get user's Soli-Contributions
 */
export const getUserPurchases = async (): Promise<TicketPurchase[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('soli_contribution_purchases')
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
 * Get all Soli-Contributions (admin only)
 */
export const getAllPurchases = async (): Promise<TicketPurchase[]> => {
  try {
    const { data, error } = await supabase
      .from('soli_contribution_purchases')
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

