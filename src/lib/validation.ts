/**
 * Input validation and sanitization utilities
 */

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Sanitizes string input to prevent XSS
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
};

/**
 * Sanitizes email input
 */
export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase().slice(0, 255);
};

/**
 * Validates and sanitizes name input
 */
export const validateAndSanitizeName = (name: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeString(name);
  
  if (!sanitized) {
    return { valid: false, sanitized: '', error: 'Name is required' };
  }
  
  if (sanitized.length < 2) {
    return { valid: false, sanitized, error: 'Name must be at least 2 characters' };
  }
  
  if (sanitized.length > 100) {
    return { valid: false, sanitized: sanitized.slice(0, 100), error: 'Name must be less than 100 characters' };
  }
  
  return { valid: true, sanitized };
};

/**
 * Validates and sanitizes email input
 */
export const validateAndSanitizeEmail = (email: string): { valid: boolean; sanitized: string; error?: string } => {
  const sanitized = sanitizeEmail(email);
  
  if (!sanitized) {
    return { valid: false, sanitized: '', error: 'Email is required' };
  }
  
  if (!isValidEmail(sanitized)) {
    return { valid: false, sanitized, error: 'Invalid email format' };
  }
  
  return { valid: true, sanitized };
};

/**
 * Validates URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

/**
 * Sanitizes URL input
 */
export const sanitizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return '';
  
  try {
    const urlObj = new URL(trimmed);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return empty string
    return '';
  }
};

/**
 * Validates numeric input
 */
export const validateNumber = (value: string, min?: number, max?: number): { valid: boolean; parsed: number | null; error?: string } => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { valid: true, parsed: null }; // Empty is valid (means unlimited)
  }
  
  const parsed = parseFloat(trimmed);
  
  if (isNaN(parsed)) {
    return { valid: false, parsed: null, error: 'Invalid number' };
  }
  
  if (min !== undefined && parsed < min) {
    return { valid: false, parsed, error: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && parsed > max) {
    return { valid: false, parsed, error: `Value must be at most ${max}` };
  }
  
  return { valid: true, parsed };
};

/**
 * Validates integer input
 */
export const validateInteger = (value: string, min?: number, max?: number): { valid: boolean; parsed: number | null; error?: string } => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { valid: true, parsed: null }; // Empty is valid (means unlimited)
  }
  
  const parsed = parseInt(trimmed, 10);
  
  if (isNaN(parsed)) {
    return { valid: false, parsed: null, error: 'Invalid integer' };
  }
  
  if (min !== undefined && parsed < min) {
    return { valid: false, parsed, error: `Value must be at least ${min}` };
  }
  
  if (max !== undefined && parsed > max) {
    return { valid: false, parsed, error: `Value must be at most ${max}` };
  }
  
  return { valid: true, parsed };
};

