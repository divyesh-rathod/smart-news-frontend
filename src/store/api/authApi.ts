import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { AuthResponse, User } from '../../types/authTypes';
import type { LoginFormData, SignupFormData } from '../../schemas/authSchemas';
import { RootState } from '../index';

// Base query with automatic token attachment
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/V1',
  
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
      
      // Transform error response
      transformErrorResponse: (response: { status: string | number; data: any }) => {
        return {
          status: response.status,
          message: response.data?.detail || 'Login failed',
        };
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
      
      transformErrorResponse: (response: { status: string | number; data: any }) => {
        return {
          status: response.status,
          message: response.data?.detail || 'Signup failed',
        };
      },
    }),
    
    // Get current user profile (protected route)
    getCurrentUser: builder.query<User, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
    
    // Update user profile
    updateUserProfile: builder.mutation<User, Partial<User>>({
      query: (userData) => ({
        url: '/users/update',
        method: 'PUT',
        body: userData,
      }),
      
      // Optimistically update cache
      async onQueryStarted(userData, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          authApi.util.updateQueryData('getCurrentUser', undefined, (draft) => {
            Object.assign(draft, userData);
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      
      invalidatesTags: ['User'],
    }),
    
    // Refresh token (if your API supports it)
    refreshToken: builder.mutation<{ access_token: string }, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
    
    // Logout (if you need server-side logout)
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      
      invalidatesTags: ['Auth', 'User'],
    }),
  }),
});

// Export hooks for use in components
export const {
  useLoginMutation,
  useSignupMutation,
  useGetCurrentUserQuery,
  useUpdateUserProfileMutation,
  useRefreshTokenMutation,
  useLogoutMutation,
} = authApi;