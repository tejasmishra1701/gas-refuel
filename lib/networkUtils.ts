/**
 * Network Utilities
 * 
 * Provides utilities for handling network requests with retry logic and timeout handling
 */

export interface RetryOptions {
  maxRetries?: number;
  timeout?: number;
  retryDelay?: number;
}

/**
 * Makes a fetch request with retry logic and timeout handling
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    timeout = 10000,
    retryDelay = 1000,
  } = retryOptions;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout);
      });

      // Create fetch promise
      const fetchPromise = fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeout),
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (
        error instanceof Error && (
          error.message.includes('400') ||
          error.message.includes('401') ||
          error.message.includes('403') ||
          error.message.includes('404')
        )
      ) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

/**
 * Checks if an error is a network-related error that should be handled gracefully
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString();
  
  return (
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('TimeoutError') ||
    errorMessage.includes('Network Error') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('ENOTFOUND') ||
    errorMessage.includes('ETIMEDOUT') ||
    errorMessage.includes('fetch')
  );
}

/**
 * Creates a safe wrapper for async functions that handles network errors
 */
export function withNetworkErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  fallbackValue?: R
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Network error handled gracefully:', error);
        return fallbackValue;
      }
      throw error;
    }
  };
}

/**
 * Debounced function to prevent rapid successive calls
 */
export function debounce<T extends any[]>(
  func: (...args: T) => void,
  wait: number
): (...args: T) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: T) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
