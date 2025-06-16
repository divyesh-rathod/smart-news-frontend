// Utility functions for handling errors safely

/**
 * Safely extracts error message from various error types
 * Handles RTK Query errors, custom API errors, and standard Error objects
 */
export const getErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
    if (!error) return fallback;
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (typeof error === 'object') {
      // RTK Query error structure
      if ('data' in error && error.data && typeof error.data === 'object') {
        const data = error.data as Record<string, unknown>;
        
        if (typeof data.detail === 'string') {
          return data.detail;
        }
        
        if (typeof data.message === 'string') {
          return data.message;
        }
      }
      
      // Custom API error structure
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
      
      // Standard Error object
      if (error instanceof Error) {
        return error.message;
      }
    }
    
    return fallback;
  };
  
  /**
   * Checks if error is a network/connectivity error
   */
  export const isNetworkError = (error: unknown): boolean => {
    if (typeof error === 'object' && error !== null) {
      if ('status' in error) {
        const status = error.status;
        return status === 'FETCH_ERROR' || status === 'PARSING_ERROR' || typeof status !== 'number';
      }
    }
    return false;
  };
  
  /**
   * Checks if error is an authentication error (401/403)
   */
  export const isAuthError = (error: unknown): boolean => {
    if (typeof error === 'object' && error !== null) {
      if ('status' in error) {
        const status = error.status;
        return status === 401 || status === 403;
      }
    }
    return false;
  };
  
  /**
   * Gets user-friendly error message based on error type
   */
  export const getUserFriendlyErrorMessage = (error: unknown): string => {
    if (isNetworkError(error)) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (isAuthError(error)) {
      return 'Authentication failed. Please check your credentials.';
    }
    
    return getErrorMessage(error, 'Something went wrong. Please try again.');
  };