import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError, logError } from '@/lib/errorHandler';

export interface TicketPurchase {
  id: string;
  user_id: string | null;
  contribution_type: 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal' | 'fastBunny' | 'reducedFastBunny';
  role: string;
  price: number;
  purchaser_name: string;
  purchaser_email: string;
  phone_number: string | null;
  status: 'confirmed' | 'cancelled';
  payment_reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  checked: boolean;
}

export interface CreatePurchaseData {
  contribution_type: 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal' | 'fastBunny' | 'reducedFastBunny';
  role: string;
  price: number;
  purchaser_name: string;
  purchaser_email: string;
  phone_number?: string;
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

export type ContributionType = 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal' | 'fastBunny' | 'reducedFastBunny';

/**
 * Check if a role has available contributions for the given ticket type.
 * Uses per-role early/fast-bunny/normal limits; unused early and fast-bunny capacity rolls over to normal-bird.
 *
 * @param role - The role to check
 * @param limitEarly - Early bird limit for this role (null = unlimited)
 * @param limitNormal - Normal bird limit for this role (null = unlimited)
 * @param contributionType - The ticket type being purchased
 * @param limitFastBunny - Fast bunny limit for this role (null = unlimited)
 */
export const checkRoleAvailability = async (
  role: string,
  limitEarly: number | null | undefined,
  limitNormal: number | null | undefined,
  contributionType: ContributionType,
  limitFastBunny?: number | null
): Promise<boolean> => {
  const isEarly = contributionType === 'earlyBird' || contributionType === 'reducedEarlyBird';
  const isFastBunny = contributionType === 'fastBunny' || contributionType === 'reducedFastBunny';

  if (isEarly) {
    if (limitEarly === null || limitEarly === undefined) return true;
    if (limitEarly === 0) return false;
    const count = await getRoleEarlyBirdPurchaseCount(role);
    return count < limitEarly;
  }

  if (isFastBunny) {
    const count = await getRoleFastBunnyPurchaseCount(role);
    if (limitFastBunny != null) {
      if (limitFastBunny === 0) return false;
      return count < limitFastBunny;
    }
    if (limitEarly == null) return true;
    const earlyCount = await getRoleEarlyBirdPurchaseCount(role);
    const availableForFastBunny = Math.max(0, limitEarly - earlyCount);
    return count < availableForFastBunny;
  }

  if (limitNormal === null || limitNormal === undefined) return true;
  const earlyCount = await getRoleEarlyBirdPurchaseCount(role);
  const fastBunnyCount = await getRoleFastBunnyPurchaseCount(role);
  const effectiveFBLimit = limitFastBunny ?? limitEarly;
  const effectiveNormal =
    limitNormal +
    Math.max(0, (limitEarly ?? 0) - earlyCount) +
    Math.max(0, (effectiveFBLimit ?? 0) - fastBunnyCount);
  if (effectiveNormal === 0) return false;
  const normalCount = await getRoleNormalBirdPurchaseCount(role);
  return normalCount < effectiveNormal;
};

export interface RemainingByType {
  early: number | null;
  fastBunny: number | null;
  normal: number | null;
}

/**
 * Get remaining contributions for a role by type (early bird, fast bunny, and normal bird).
 * Normal-bird remaining includes unused early-bird and fast-bunny capacity.
 */
export const getRemainingTickets = async (
  role: string,
  limitEarly: number | null | undefined,
  limitNormal: number | null | undefined,
  limitFastBunny?: number | null
): Promise<RemainingByType> => {
  const earlyCount = await getRoleEarlyBirdPurchaseCount(role);
  const fastBunnyCount = await getRoleFastBunnyPurchaseCount(role);

  const earlyRemaining =
    limitEarly != null ? Math.max(0, limitEarly - earlyCount) : null;
  // When shared pool (limitFastBunny null): leftover from Early Bird = limitEarly - earlyCount - fastBunnyCount
  // When own limit: effectiveFBLimit - fastBunnyCount
  const fastBunnyRemaining =
    limitFastBunny != null
      ? Math.max(0, limitFastBunny - fastBunnyCount)
      : limitEarly != null
        ? Math.max(0, limitEarly - earlyCount - fastBunnyCount)
        : null;
  // Rollover: when shared pool, combined unused = limitEarly - earlyCount - fastBunnyCount
  const unusedForRollover =
    limitFastBunny != null
      ? Math.max(0, (limitEarly ?? 0) - earlyCount) + Math.max(0, limitFastBunny - fastBunnyCount)
      : Math.max(0, (limitEarly ?? 0) - earlyCount - fastBunnyCount);
  const effectiveNormal =
    limitNormal != null ? limitNormal + unusedForRollover : null;
  const normalRemaining =
    effectiveNormal != null
      ? Math.max(0, effectiveNormal - (await getRoleNormalBirdPurchaseCount(role)))
      : null;
  return { early: earlyRemaining, fastBunny: fastBunnyRemaining, normal: normalRemaining };
};

/**
 * Get remaining early-bird tickets for a single role.
 */
export const getRemainingEarlyBirdTicketsForRole = async (
  role: string,
  limitEarly: number | null | undefined
): Promise<number | null> => {
  if (limitEarly === null || limitEarly === undefined) return null;
  const count = await getRoleEarlyBirdPurchaseCount(role);
  return Math.max(0, limitEarly - count);
};

/**
 * Get remaining normal-bird tickets for a single role (includes unused early-bird and fast-bunny capacity).
 */
export const getRemainingNormalBirdTicketsForRole = async (
  role: string,
  limitNormal: number | null | undefined,
  limitEarly: number | null | undefined,
  limitFastBunny?: number | null
): Promise<number | null> => {
  if (limitNormal === null || limitNormal === undefined) return null;
  const earlyCount = await getRoleEarlyBirdPurchaseCount(role);
  const fastBunnyCount = await getRoleFastBunnyPurchaseCount(role);
  const effectiveNormal =
    limitNormal +
    Math.max(0, (limitEarly ?? 0) - earlyCount) +
    Math.max(0, (limitFastBunny ?? 0) - fastBunnyCount);
  const normalCount = await getRoleNormalBirdPurchaseCount(role);
  return Math.max(0, effectiveNormal - normalCount);
};

/**
 * Get the number of confirmed early-bird Soli-Contributions for a specific role.
 */
export const getRoleEarlyBirdPurchaseCount = async (role: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('soli_contribution_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)
      .in('contribution_type', ['earlyBird', 'reducedEarlyBird'])
      .eq('status', 'confirmed');

    if (error) {
      logError('TicketPurchases', error, { operation: 'getRoleEarlyBirdPurchaseCount', role });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getRoleEarlyBirdPurchaseCount', role });
    return 0;
  }
};

/**
 * Get the number of confirmed normal-bird Soli-Contributions for a specific role.
 */
export const getRoleNormalBirdPurchaseCount = async (role: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('soli_contribution_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)
      .in('contribution_type', ['normal', 'reducedNormal'])
      .eq('status', 'confirmed');

    if (error) {
      logError('TicketPurchases', error, { operation: 'getRoleNormalBirdPurchaseCount', role });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getRoleNormalBirdPurchaseCount', role });
    return 0;
  }
};

/**
 * Get the number of confirmed fast-bunny Soli-Contributions for a specific role.
 */
export const getRoleFastBunnyPurchaseCount = async (role: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('soli_contribution_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)
      .in('contribution_type', ['fastBunny', 'reducedFastBunny'])
      .eq('status', 'confirmed');

    if (error) {
      logError('TicketPurchases', error, { operation: 'getRoleFastBunnyPurchaseCount', role });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getRoleFastBunnyPurchaseCount', role });
    return 0;
  }
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
 * Get the number of confirmed fast-bunny Soli-Contributions (across all roles)
 */
export const getFastBunnyPurchaseCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('soli_contribution_purchases')
      .select('*', { count: 'exact', head: true })
      .in('contribution_type', ['fastBunny', 'reducedFastBunny'])
      .eq('status', 'confirmed');

    if (error) {
      logError('TicketPurchases', error, { operation: 'getFastBunnyPurchaseCount' });
      return 0;
    }

    return count || 0;
  } catch (error) {
    logError('TicketPurchases', error, { operation: 'getFastBunnyPurchaseCount' });
    return 0;
  }
};

/**
 * Get remaining fast-bunny Soli-Contributions.
 * When totalLimit is null and earlyBirdTotalLimit is set, uses shared pool (leftover Early Bird tickets).
 */
export const getRemainingFastBunnyTickets = async (
  totalLimit: number | null | undefined,
  earlyBirdTotalLimit?: number | null
): Promise<number | null> => {
  if (totalLimit != null) {
    const purchaseCount = await getFastBunnyPurchaseCount();
    return Math.max(0, totalLimit - purchaseCount);
  }
  if (earlyBirdTotalLimit != null) {
    const earlyCount = await getEarlyBirdPurchaseCount();
    const fbCount = await getFastBunnyPurchaseCount();
    return Math.max(0, earlyBirdTotalLimit - earlyCount - fbCount);
  }
  return null;
};

/**
 * Get remaining early-bird Soli-Contributions
 */
export const getRemainingEarlyBirdTickets = async (
  totalLimit: number | null | undefined
): Promise<number | null> => {
  if (totalLimit === null || totalLimit === undefined) return null;
  const purchaseCount = await getEarlyBirdPurchaseCount();
  return Math.max(0, totalLimit - purchaseCount);
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
 * Uses per-role early/fast-bunny/normal limits and contribution type.
 */
export const validatePurchaseLimit = async (
  role: string,
  limitEarly: number | null | undefined,
  limitNormal: number | null | undefined,
  contributionType: ContributionType,
  limitFastBunny?: number | null
): Promise<{ isValid: boolean; error?: string }> => {
  const isAvailable = await checkRoleAvailability(
    role,
    limitEarly,
    limitNormal,
    contributionType,
    limitFastBunny
  );

  if (!isAvailable) {
    const { early, fastBunny, normal } = await getRemainingTickets(
      role,
      limitEarly,
      limitNormal,
      limitFastBunny
    );
    const isEarly = contributionType === 'earlyBird' || contributionType === 'reducedEarlyBird';
    const isFastBunny = contributionType === 'fastBunny' || contributionType === 'reducedFastBunny';
    const remaining = isEarly ? early : isFastBunny ? fastBunny : normal;
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
    const isFastBunny = purchaseData.contribution_type === 'fastBunny' || purchaseData.contribution_type === 'reducedFastBunny';
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

    if (isFastBunny && (settings.fast_bunny_total_limit != null || settings.early_bird_total_limit != null)) {
      const remaining = await getRemainingFastBunnyTickets(
        settings.fast_bunny_total_limit ?? null,
        settings.early_bird_total_limit ?? null
      );
      if (remaining !== null && remaining <= 0) {
        return {
          success: false,
          error: 'Fast Bunny tickets are sold out. The universal limit has been reached.',
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
    
    if (validateLimit) {
      const limitEarlyFieldMap: Record<string, keyof typeof settings> = {
        bar: 'bar_limit_early',
        kuechenhilfe: 'kuechenhilfe_limit_early',
        springerRunner: 'springer_runner_limit_early',
        springerToilet: 'springer_toilet_limit_early',
        abbau: 'abbau_limit_early',
        aufbau: 'aufbau_limit_early',
        awareness: 'awareness_limit_early',
        tech: 'tech_limit_early',
      };
      const limitNormalFieldMap: Record<string, keyof typeof settings> = {
        bar: 'bar_limit_normal',
        kuechenhilfe: 'kuechenhilfe_limit_normal',
        springerRunner: 'springer_runner_limit_normal',
        springerToilet: 'springer_toilet_limit_normal',
        abbau: 'abbau_limit_normal',
        aufbau: 'aufbau_limit_normal',
        awareness: 'awareness_limit_normal',
        tech: 'tech_limit_normal',
      };
      const limitFastBunnyFieldMap: Record<string, keyof typeof settings> = {
        bar: 'bar_limit_fast_bunny',
        kuechenhilfe: 'kuechenhilfe_limit_fast_bunny',
        springerRunner: 'springer_runner_limit_fast_bunny',
        springerToilet: 'springer_toilet_limit_fast_bunny',
        abbau: 'abbau_limit_fast_bunny',
        aufbau: 'aufbau_limit_fast_bunny',
        awareness: 'awareness_limit_fast_bunny',
        tech: 'tech_limit_fast_bunny',
      };
      const earlyField = limitEarlyFieldMap[purchaseData.role];
      const normalField = limitNormalFieldMap[purchaseData.role];
      const fastBunnyField = limitFastBunnyFieldMap[purchaseData.role];
      if (earlyField && normalField) {
        const limitEarly = settings[earlyField] as number | null | undefined;
        const limitNormal = settings[normalField] as number | null | undefined;
        const limitFastBunny = fastBunnyField
          ? (settings[fastBunnyField] as number | null | undefined)
          : undefined;
        const validation = await validatePurchaseLimit(
          purchaseData.role,
          limitEarly,
          limitNormal,
          purchaseData.contribution_type,
          limitFastBunny
        );
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
        phone_number: purchaseData.phone_number || null,
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

/**
 * Create a new Soli-Contribution purchase (admin only).
 * This function bypasses all capacity and universal limits, allowing admins to manually add contributions.
 * 
 * @param purchaseData - The Soli-Contribution data to create
 * @returns Object with success flag and optional purchase or error
 */
export const createTicketPurchaseAdmin = async (
  purchaseData: CreatePurchaseData
): Promise<{ success: boolean; purchase?: TicketPurchase; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('soli_contribution_purchases')
      .insert({
        user_id: null, // Manual entries don't have a user_id
        contribution_type: purchaseData.contribution_type,
        role: purchaseData.role,
        price: purchaseData.price,
        purchaser_name: purchaseData.purchaser_name,
        purchaser_email: purchaseData.purchaser_email,
        phone_number: purchaseData.phone_number || null,
        payment_reference: purchaseData.payment_reference || null,
        notes: purchaseData.notes || null,
        status: purchaseData.status || 'confirmed',
        checked: false, // New purchases appear in "Pending Soli-Contributions" tab
      })
      .select()
      .single();

    if (error) {
      logError('TicketPurchases', error, { operation: 'createTicketPurchaseAdmin', purchaseData });
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
    logError('TicketPurchases', error, { operation: 'createTicketPurchaseAdmin', purchaseData });
    return {
      success: false,
      error: formatSupabaseError(error),
    };
  }
};

/**
 * Update an existing Soli-Contribution purchase (admin only).
 * Allows updating contact fields and contribution meta (type, role, price).
 * 
 * @param purchaseId - The ID of the purchase to update
 * @param updateData - Partial update data (contact + meta fields)
 * @returns Object with success flag and optional purchase or error
 */
export const updateTicketPurchaseAdmin = async (
  purchaseId: string,
  updateData: Partial<{
    contribution_type: 'earlyBird' | 'normal' | 'reducedEarlyBird' | 'reducedNormal' | 'fastBunny' | 'reducedFastBunny';
    role: string;
    price: number;
    purchaser_name: string;
    purchaser_email: string;
    phone_number: string | null;
    payment_reference: string | null;
    notes: string | null;
  }>
): Promise<{ success: boolean; purchase?: TicketPurchase; error?: string }> => {
  try {
    // Filter out undefined values
    const dataToUpdate = Object.entries(updateData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    if (Object.keys(dataToUpdate).length === 0) {
      return {
        success: false,
        error: 'No fields to update',
      };
    }

    const { data, error } = await supabase
      .from('soli_contribution_purchases')
      .update(dataToUpdate)
      .eq('id', purchaseId)
      .select()
      .single();

    if (error) {
      logError('TicketPurchases', error, { operation: 'updateTicketPurchaseAdmin', purchaseId, updateData });
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
    logError('TicketPurchases', error, { operation: 'updateTicketPurchaseAdmin', purchaseId, updateData });
    return {
      success: false,
      error: formatSupabaseError(error),
    };
  }
};
