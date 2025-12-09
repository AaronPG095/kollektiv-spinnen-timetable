/**
 * Centralized error handling utilities
 */

export interface AppError {
  message: string;
  code?: string;
  status?: number;
  userMessage?: string;
}

/**
 * Safely extracts error message without leaking sensitive information
 */
export const getSafeErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Don't expose internal error details in production
    if (import.meta.env.PROD) {
      // In production, return generic messages
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
      }
      if (error.message.includes('permission') || error.message.includes('403')) {
        return 'Permission denied. Please ensure you have the required access.';
      }
      if (error.message.includes('not found') || error.message.includes('404')) {
        return 'Resource not found.';
      }
      return 'An unexpected error occurred. Please try again later.';
    }
    // In development, return full error message
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred.';
};

/**
 * Creates a user-friendly error message from Supabase errors
 */
export const formatSupabaseError = (error: any): string => {
  if (!error) {
    return 'An unexpected error occurred.';
  }
  
  // Handle specific Supabase error codes
  if (error.code === 'PGRST116') {
    return 'Resource not found.';
  }
  
  if (error.code === '42501' || error.status === 403) {
    return 'Permission denied. Please ensure you have the required access.';
  }
  
  if (error.code === '23505') {
    return 'This record already exists.';
  }
  
  if (error.code === '23503') {
    return 'Invalid reference. Please check your input.';
  }
  
  // Return user-friendly message if available, otherwise generic message
  if (error.message && typeof error.message === 'string') {
    // Don't expose technical details in production
    if (import.meta.env.PROD) {
      // Return a sanitized version
      return error.message.split('\n')[0].slice(0, 200);
    }
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Logs error safely without exposing sensitive data
 */
export const logError = (context: string, error: unknown, additionalInfo?: Record<string, unknown>): void => {
  const errorInfo: Record<string, unknown> = {
    context,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  };
  
  if (error instanceof Error) {
    errorInfo.message = error.message;
    errorInfo.stack = import.meta.env.DEV ? error.stack : undefined; // Only log stack in dev
  } else {
    errorInfo.error = String(error);
  }
  
  console.error(`[${context}]`, errorInfo);
};

