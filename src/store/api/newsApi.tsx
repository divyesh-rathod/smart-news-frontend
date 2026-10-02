// src/store/api/newsApi.tsx
import { createApi, fetchBaseQuery, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type {
  ArticlesResponse,
  ArticleScore,
  EnhancedArticle,
  LikeResponse,
  LikeResult,
} from '../../types/articleTypes';
import type { RootState } from '../index';

// ============================================================================
// TRANSFORMATION (API → reading list)
// ============================================================================

/** A recommendation from the like response, as an article for the reading list. */
export const toRecommendedArticle = (score: ArticleScore, sourceArticleId: string): EnhancedArticle => ({
  article_id: score.article_id,
  title: score.title,
  link: score.link,
  cleaned_text: score.cleaned_text,
  category_1: score.category_1,
  category_2: score.category_2,
  description: score.cleaned_text,
  categories: score.category_1 ? [score.category_1] : null,
  // The like response carries no dates; nothing in the reader shows them.
  processed_at: new Date().toISOString(),
  pub_date: new Date().toISOString(),
  // Not known from the like response; the store's likedArticleIds decides what shows as liked.
  liked: false,
  isSimilar: true,
  sourceArticleId,
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

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

// ============================================================================
// BASE QUERY CONFIGURATION
// ============================================================================

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

// ============================================================================
// NEWS API
// ============================================================================

export const newsApi = createApi({
  reducerPath: 'newsApi',
  baseQuery,
  
  tagTypes: ['Article', 'UnseenArticles'],
  
  endpoints: (builder) => ({
    
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
      
      transformErrorResponse: (error: FetchBaseQueryError) => handleApiError(error),
      keepUnusedDataFor: 300, // Cache for 5 minutes
    }),

    // Nothing is refetched afterwards: the reading list lives in the news slice, and every feed request
    // moves the server's feed cursor on by a page, so a refetch nobody reads skips unseen articles.
    markArticleAsRead: builder.mutation<string, string>({
      query: (articleId) => ({
        url: `/news/mark-as-read/${articleId}`,
        method: 'POST',
      }),
      
      transformErrorResponse: (error: FetchBaseQueryError) => handleApiError(error),
    }),

    // Idempotent: sends the state the user wants, not "flip it". Driven by toggleArticleLike in likeArticle.ts.
    setArticleLike: builder.mutation<LikeResult, { articleId: string; liked: boolean }>({
      query: ({ articleId, liked }) => ({
        url: `/news/like/${articleId}`,
        method: 'PUT',
        body: { liked },
      }),

      transformResponse: (response: LikeResponse, _meta, { articleId }): LikeResult => ({
        liked: response.liked,
        recommendations: response.top5.map((score) => toRecommendedArticle(score, articleId)),
      }),

      transformErrorResponse: (error: FetchBaseQueryError) => handleApiError(error),
    }),

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

// ============================================================================
// EXPORT HOOKS
// ============================================================================

export const {
  useGetUnseenArticlesQuery,
  useLazyGetUnseenArticlesQuery,
  useMarkArticleAsReadMutation,
  useSetLastReadDateMutation,
} = newsApi;
