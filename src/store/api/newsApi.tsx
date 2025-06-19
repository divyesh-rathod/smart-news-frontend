// src/store/api/newsApi.ts
import { createApi, fetchBaseQuery, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { ArticlesResponse, ToggleLikeResponse } from '../../types/articleTypes';
import { type RootState } from '../index';

// Custom error handler (reuse from authApi)
const handleApiError = (error: FetchBaseQueryError) => {
  if ('status' in error) {
    if (error.status === 'FETCH_ERROR') {
      return {
        status: 'FETCH_ERROR',
        message: error.error || 'Network error occurred',
      };
    }
    
    if (typeof error.status === 'number') {
      const errorData = error.data as any;
      return {
        status: error.status,
        message: errorData?.detail || errorData?.message || `HTTP Error ${error.status}`,
      };
    }
  }
  
  return {
    status: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
  };
};

// Base query with auth token
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/V1',
  
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

// News API slice
export const newsApi = createApi({
  reducerPath: 'newsApi',
  baseQuery,
  
  tagTypes: ['Article', 'UnseenArticles'],
  
  endpoints: (builder) => ({
    // Get unseen articles with pagination
    getUnseenArticles: builder.query<
      ArticlesResponse,
      { cursor?: string | null; limit?: number; offset?: number }
    >({
      query: ({ cursor, limit = 20, offset = 0 }) => {
        const params = new URLSearchParams();
        if (cursor) params.append('cursor', cursor);
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        
        return `/news/unseen-articles?${params}`;
      },
      
      providesTags: (result) =>
        result
          ? [
              ...result.results.map(({ article_id }) => ({ type: 'Article' as const, id: article_id })),
              { type: 'UnseenArticles', id: 'LIST' },
            ]
          : [{ type: 'UnseenArticles', id: 'LIST' }],
      
      // Transform for caching/merging
      transformResponse: (response: ArticlesResponse) => response,
      
      transformErrorResponse: (error: FetchBaseQueryError) => handleApiError(error),
      
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),

    // Mark article as read
    markArticleAsRead: builder.mutation<string, string>({
      query: (articleId) => ({
        url: `/news/mark-as-read/${articleId}`,
        method: 'POST',
      }),
      
      // Optimistically update cache
      async onQueryStarted(articleId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Invalidate unseen articles to refetch
          dispatch(newsApi.util.invalidateTags([{ type: 'UnseenArticles', id: 'LIST' }]));
        } catch {
          // Error handling
        }
      },
      
      transformErrorResponse: (error: FetchBaseQueryError) => handleApiError(error),
    }),

    // Toggle article like
    toggleArticleLike: builder.mutation<ToggleLikeResponse, string>({
      query: (articleId) => ({
        url: `/news/toggle-like/${articleId}`,
        method: 'POST',
      }),
      
      transformErrorResponse: (error: FetchBaseQueryError) => handleApiError(error),
    }),

    // Set last read date
    setLastReadDate: builder.mutation<string, { last_read_date?: string }>({
      query: (payload) => ({
        url: '/news/set-date',
        method: 'POST',
        body: payload,
      }),
      
      transformErrorResponse: (error: FetchBaseQueryError) => handleApiError(error),
    }),
  }),
});

// Export hooks for components
export const {
  useGetUnseenArticlesQuery,
  useLazyGetUnseenArticlesQuery,
  useMarkArticleAsReadMutation,
  useToggleArticleLikeMutation,
  useSetLastReadDateMutation,
} = newsApi;