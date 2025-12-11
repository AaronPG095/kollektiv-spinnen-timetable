/**
 * Input validation and sanitization utilities
 */

/**
 * Validates email format with more robust pattern
 */
export const isValidEmail = (email: string): boolean => {
  // More comprehensive email regex pattern
  // Allows: letters, numbers, dots, hyphens, underscores, plus signs before @
  // Requires: @ symbol, domain name, TLD (at least 2 characters)
  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const trimmed = email.trim();
  
  // Basic length checks
  if (trimmed.length === 0) return false;
  if (trimmed.length > 254) return false; // RFC 5321 limit
  
  // Check for common invalid patterns
  if (trimmed.startsWith('.') || trimmed.startsWith('@') || trimmed.startsWith('+')) return false;
  if (trimmed.includes('..')) return false; // No consecutive dots
  if (trimmed.includes('@.') || trimmed.includes('.@')) return false;
  
  return emailRegex.test(trimmed);
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
 * Validates and sanitizes email input with detailed error messages
 */
export const validateAndSanitizeEmail = (email: string): { valid: boolean; sanitized: string; error?: string } => {
  const trimmed = email.trim();
  
  if (!trimmed) {
    return { valid: false, sanitized: '', error: 'Email is required' };
  }
  
  if (trimmed.length > 254) {
    return { valid: false, sanitized: trimmed.slice(0, 254), error: 'Email is too long (maximum 254 characters)' };
  }
  
  // Check for @ symbol
  if (!trimmed.includes('@')) {
    return { valid: false, sanitized: trimmed, error: 'Email must contain @ symbol' };
  }
  
  // Check for domain part
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, sanitized: trimmed, error: 'Email must contain exactly one @ symbol' };
  }
  
  const [localPart, domain] = parts;
  
  if (!localPart || localPart.length === 0) {
    return { valid: false, sanitized: trimmed, error: 'Email must have a local part before @' };
  }
  
  if (!domain || domain.length === 0) {
    return { valid: false, sanitized: trimmed, error: 'Email must have a domain after @' };
  }
  
  // Check for TLD
  if (!domain.includes('.')) {
    return { valid: false, sanitized: trimmed, error: 'Email domain must contain a dot (e.g., example.com)' };
  }
  
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  
  if (!tld || tld.length < 2) {
    return { valid: false, sanitized: trimmed, error: 'Email domain must have a valid top-level domain (e.g., .com, .org)' };
  }
  
  // Final validation with regex
  if (!isValidEmail(trimmed)) {
    return { valid: false, sanitized: trimmed, error: 'Invalid email format. Please check your email address' };
  }
  
  const sanitized = sanitizeEmail(trimmed);
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

