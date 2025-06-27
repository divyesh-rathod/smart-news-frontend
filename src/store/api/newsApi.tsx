// src/store/api/newsApi.tsx
import { createApi, fetchBaseQuery, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import type { 
  ArticlesResponse, 
  ToggleLikeResponse, 
  Article,
  ArticleScore,
  EnhancedArticle,
  SimilarArticlesResult 
} from '../../types/articleTypes';
import { type RootState } from '../index';

// ============================================================================
// TRANSFORMATION UTILITIES (API → Enhanced Types)
// ============================================================================

/**
 * Transform regular Article to EnhancedArticle (without like state - will be set later)
 * 
 * NOTE: We don't set isLiked here because transformResponse doesn't have access to Redux state.
 * The liked status will be synced by Redux slice actions when articles are processed.
 */
const transformToEnhancedArticle = (
  article: Article,
  enhancements?: {
    isSimilar?: boolean;
    sourceArticleId?: string;
    isLikeLoading?: boolean;
  }
): EnhancedArticle => {
  return {
    ...article,
    isLiked: false, // Will be set by Redux slice based on liked articles state
    isSimilar: enhancements?.isSimilar || false,
    sourceArticleId: enhancements?.sourceArticleId,
    isLikeLoading: enhancements?.isLikeLoading || false,
  };
};

/**
 * Transform ArticleScore (from ML model) to EnhancedArticle
 * Uses the complete article data from top5 response
 */
const transformArticleScoreToEnhanced = (
  articleScore: ArticleScore,
  sourceArticleId: string
): EnhancedArticle => {
  // Convert ArticleScore to Article format (all fields are available now!)
  const article: Article = {
    article_id: articleScore.article_id,
    cleaned_text: articleScore.cleaned_text,
    category_1: articleScore.category_1,
    category_2: articleScore.category_2,
    processed_at: new Date().toISOString(), // Default value for missing field
    pub_date: new Date().toISOString(),     // Default value for missing field  
    title: articleScore.title,              // ✅ Now available from API
    link: articleScore.link,                // ✅ Now available from API
    description: articleScore.cleaned_text, // Use cleaned_text as description
    categories: articleScore.category_1 // Combine categories
  };

  // Return as EnhancedArticle with similar article metadata
  return {
    ...article,
    isLiked: false,           // Similar articles start as not liked
    isSimilar: true,          // Mark as similar article
    sourceArticleId,          // Track which article triggered this
    isLikeLoading: false,
  };
};

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
// ENHANCED NEWS API
// ============================================================================

export const newsApi = createApi({
  reducerPath: 'newsApi',
  baseQuery,
  
  tagTypes: ['Article', 'UnseenArticles', 'LikedArticles'],
  
  endpoints: (builder) => ({
    
    // ========================================================================
    // ✅ EXISTING - Get unseen articles (Enhanced with transformations)
    // ========================================================================
    
    getUnseenArticles: builder.query<
      { results: EnhancedArticle[]; next_cursor: string | null },
      { cursor?: string | null; limit?: number; offset?: number }
    >({
      query: ({ cursor, limit = 20, offset = 0 }) => {
        const params = new URLSearchParams();
        if (cursor) params.append('cursor', cursor);
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        
        return `/news/unseen-articles?${params}`;
      },
      
      // Transform API response to enhanced articles
      transformResponse: (response: ArticlesResponse) => {
        const enhancedResults = response.results.map(article => 
          transformToEnhancedArticle(article)
        );
        
        return {
          results: enhancedResults,
          next_cursor: response.next_cursor
        };
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

    // ========================================================================
    // ✅ EXISTING - Mark article as read (Unchanged)
    // ========================================================================
    
    markArticleAsRead: builder.mutation<string, string>({
      query: (articleId) => ({
        url: `/news/mark-as-read/${articleId}`,
        method: 'POST',
      }),
      
      async onQueryStarted(articleId, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(newsApi.util.invalidateTags([{ type: 'UnseenArticles', id: 'LIST' }]));
        } catch {
          // Error handling
        }
      },
      
      transformErrorResponse: (error: FetchBaseQueryError) => handleApiError(error),
    }),

    // ========================================================================
    // 🆕 ENHANCED - Toggle article like (With similar articles handling)
    // ========================================================================
    
    toggleArticleLike: builder.mutation<
      {
        apiResponse: ToggleLikeResponse;
        similarArticlesResult: SimilarArticlesResult | null;
      },
      { articleId: string; userCurrentIndex: number }
    >({
      query: ({ articleId }) => ({
        url: `/news/toggle-like/${articleId}`,
        method: 'POST',
      }),
      
      // 🎯 OPTIMISTIC UPDATES - UI responds immediately
      async onQueryStarted({ articleId, userCurrentIndex }, { dispatch, queryFulfilled, getState }) {
        const state = getState() as RootState;
        const currentlyLiked = state.news.likedArticleIds.has(articleId);
        const newLikedState = !currentlyLiked;
        
        console.log(`🚀 Starting like toggle for ${articleId}: ${currentlyLiked} → ${newLikedState}`);
        
        // 1. Optimistic update - Start the like process immediately
        const { startLikeToggle } = await import('../slices/newsSlice');
        dispatch(startLikeToggle({ 
          articleId, 
          isLiked: newLikedState,
          userCurrentIndex 
        }));
        
        try {
          // 2. Wait for API response
          const { data } = await queryFulfilled;
          const { apiResponse, similarArticlesResult } = data;
          
          console.log('✅ Like API Success:', apiResponse);
          
          // 3. Complete the like toggle
          const { completeLikeToggle } = await import('../slices/newsSlice');
          dispatch(completeLikeToggle({
            articleId,
            isLiked: apiResponse.liked,
            success: true
          }));
          
          // 4. Handle similar articles if user liked the article (only top5 array)
          if (apiResponse.liked && similarArticlesResult) {
            console.log(`🎯 Processing ${similarArticlesResult.similarArticles.length} similar articles from top5`);
            
            // Decide whether to insert immediately or queue for later
            const currentState = getState() as RootState;
            const currentIndex = currentState.news.currentIndex;
            const insertPosition = similarArticlesResult.insertPosition;
            
            // If user hasn't moved far from insertion point, insert immediately
            if (Math.abs(currentIndex - insertPosition) <= 2) {
              const { insertSimilarArticles } = await import('../slices/newsSlice');
              dispatch(insertSimilarArticles(similarArticlesResult));
            } else {
              // User moved far, queue for next navigation
              const { queueSimilarArticles } = await import('../slices/newsSlice');
              dispatch(queueSimilarArticles(similarArticlesResult));
            }
          }
          
        } catch (error) {
          console.error('❌ Like API Error:', error);
          
          // 4. Revert optimistic update on failure
          const { completeLikeToggle } = await import('../slices/newsSlice');
          dispatch(completeLikeToggle({
            articleId,
            isLiked: currentlyLiked, // Revert to original state
            success: false
          }));
        }
      },
      
      // Transform the API response for our frontend use
      transformResponse: (apiResponse: ToggleLikeResponse, meta, { articleId }): {
        apiResponse: ToggleLikeResponse;
        similarArticlesResult: SimilarArticlesResult | null;
      } => {
        console.log('🔄 Transforming like API response:', apiResponse);
        
        // ✅ ONLY USE TOP5 ARRAY (ignore similar array as requested)
        if (apiResponse.liked && apiResponse.top5.length > 0) {
          
          console.log(`🎯 Processing ${apiResponse.top5.length} similar articles from top5 array`);
          
          // Transform top5 ArticleScore[] to EnhancedArticle[]
          const similarArticles = apiResponse.top5.map(score => 
            transformArticleScoreToEnhanced(score, articleId)
          );
          
          const similarArticlesResult: SimilarArticlesResult = {
            sourceArticleId: articleId,
            similarArticles: similarArticles, // Will be exactly 5 articles from ML model
            insertPosition: 0, // Will be set by the onQueryStarted logic
          };
          
          return {
            apiResponse,
            similarArticlesResult
          };
        }
        
        // No similar articles or user unliked or top5 is empty
        return {
          apiResponse,
          similarArticlesResult: null
        };
      },
      
      // Invalidate related caches
      invalidatesTags: (result, error, { articleId }) => [
        { type: 'Article', id: articleId },
        { type: 'LikedArticles', id: 'LIST' }
      ],
      
      transformErrorResponse: (error: FetchBaseQueryError) => handleApiError(error),
    }),

    // ========================================================================
    // ✅ EXISTING - Set last read date (Unchanged)
    // ========================================================================
    
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
  useToggleArticleLikeMutation,  // 🆕 Enhanced with similar articles
  useSetLastReadDateMutation,
} = newsApi;