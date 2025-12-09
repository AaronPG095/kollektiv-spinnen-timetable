/**
 * Retry utility for failed API calls
 */

export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: unknown) => void;
}

/**
 * Retries a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 'exponential',
    onRetry,
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Calculate delay based on backoff strategy
      const currentDelay = backoff === 'exponential'
        ? delay * Math.pow(2, attempt - 1)
        : delay * attempt;
      
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }
  
  throw lastError;
}

