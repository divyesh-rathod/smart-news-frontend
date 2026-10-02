import { createApi, fetchBaseQuery, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { AuthResponse, User } from '../../types/authTypes';
import type { LoginFormData, SignupFormData } from '../../schemas/authSchemas';
import type { RootState } from '../index';

// Custom error type for our API
interface ApiError {
  status: string | number;
  message: string;
}

// Helper function to handle different error types
const handleApiError = (error: FetchBaseQueryError): ApiError => {
  if ('status' in error) {
    // HTTP error
    if (error.status === 'FETCH_ERROR') {
      return {
        status: 'FETCH_ERROR',
        message: error.error || 'Network error occurred',
      };
    }
    
    if (error.status === 'PARSING_ERROR') {
      return {
        status: 'PARSING_ERROR',
        message: 'Failed to parse server response',
      };
    }
    
    if (error.status === 'TIMEOUT_ERROR') {
      return {
        status: 'TIMEOUT_ERROR',
        message: 'Request timeout',
      };
    }
    
    // HTTP status errors (400, 401, 500, etc.)
    if (typeof error.status === 'number') {
      const errorData = error.data as any;
      return {
        status: error.status,
        message: errorData?.detail || errorData?.message || `HTTP Error ${error.status}`,
      };
    }
  }
  
  // Fallback for unknown error types
  return {
    status: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
};

// Base query with automatic token attachment
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/V1',
  
  // Automatically add auth token to requests
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Auth API slice
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  
  // Tag types for cache invalidation
  tagTypes: ['User', 'Auth'],
  
  endpoints: (builder) => ({
    // Login mutation
    login: builder.mutation<AuthResponse, LoginFormData>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      
      // Invalidate auth-related cache on successful login
      invalidatesTags: ['Auth', 'User'],
      
      // Transform response if needed
      transformResponse: (response: AuthResponse) => response,
      
      // Fixed: Proper error handling for FetchBaseQueryError
      transformErrorResponse: (error: FetchBaseQueryError) => {
        return handleApiError(error);
      },
    }),
    
    // Signup mutation
    signup: builder.mutation<AuthResponse, SignupFormData>({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
      
      invalidatesTags: ['Auth', 'User'],
      
      // Fixed: Proper error handling
      transformErrorResponse: (error: FetchBaseQueryError) => {
        return handleApiError(error);
      },
    }),
    
    // Update user profile
    updateUserProfile: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: '/users/update',
        method: 'PUT',
        body: userData,
      }),
      
      invalidatesTags: ['User'],
      
      transformErrorResponse: (error: FetchBaseQueryError) => {
        return handleApiError(error);
      },
    }),
  }),
});

// Export hooks for use in components
export const {
  useLoginMutation,
  useSignupMutation,
  useUpdateUserProfileMutation,
} = authApi;