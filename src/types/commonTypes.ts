// Common types used across the application

export interface APIResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResponse<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

// Loading state using union types (better than boolean flags)
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

// MUI Button color types for type safety
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' | 'inherit';

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Form validation states
export interface FormState {
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  errors: Record<string, string>;
}