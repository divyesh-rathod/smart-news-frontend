// src/store/slices/newsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { 
  EnhancedArticle, 
  PendingSimilarRequest, 
  SimilarArticlesResult 
} from '../../types/articleTypes';

// ============================================================================
// STATE INTERFACE (Enhanced with Like Functionality)
// ============================================================================

interface NewsState {
  // ✅ EXISTING - Article navigation
  currentIndex: number;
  currentArticle: EnhancedArticle | null;
  
  // ✅ EXISTING - Pagination state
  nextCursor: string | null;
  hasMoreArticles: boolean;
  
  // ✅ EXISTING - UI state
  isNavigating: boolean;
  viewMode: 'single' | 'list';
  
  // ✅ EXISTING - Reading preferences
  articlesPerPage: number;
  autoMarkAsRead: boolean;
  
  // ✅ EXISTING - Cache for merged articles
  allArticles: EnhancedArticle[];
  
  // ✅ EXISTING - Filters
  selectedCategories: string[];
  searchQuery: string;
  
  // 🔧 FIXED - Like functionality (now serializable)
  likedArticleIds: string[];                                      // ✅ Array instead of Set
  pendingSimilarRequests: { [key: string]: PendingSimilarRequest }; // ✅ Object instead of Map
  isLikeLoading: { [key: string]: boolean };                      // ✅ Object instead of Map
  
  // 🆕 NEW - Similar articles management
  similarArticlesQueue: EnhancedArticle[];
  insertionQueue: SimilarArticlesResult[];
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: NewsState = {
  // Existing state
  currentIndex: 0,
  currentArticle: null,
  nextCursor: null,
  hasMoreArticles: true,
  isNavigating: false,
  viewMode: 'single',
  articlesPerPage: 20,
  autoMarkAsRead: false,
  allArticles: [],
  selectedCategories: [],
  searchQuery: '',
  
  // 🔧 FIXED - Like state (now serializable)
  likedArticleIds: [],
  pendingSimilarRequests: {},
  isLikeLoading: {},
  
  // New similar articles state
  similarArticlesQueue: [],
  insertionQueue: [],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to check if article is liked
 */
const isArticleLiked = (articleId: string, likedIds: string[]): boolean => {
  return likedIds.includes(articleId);
};

/**
 * Helper to create updated article with like status
 */
const updateArticleWithLikeStatus = (article: EnhancedArticle, likedIds: string[]): EnhancedArticle => {
  return {
    ...article,
    isLiked: isArticleLiked(article.article_id, likedIds)
  };
};

// ============================================================================
// REDUX SLICE
// ============================================================================

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    
    // ========================================================================
    // ✅ EXISTING ACTIONS (Fixed with proper immutable updates)
    // ========================================================================
    
    /**
     * Set current article index and sync liked status
     */
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
      const article = state.allArticles[action.payload];
      
      if (article) {
        // 🔧 FIXED - Create new object instead of mutating
        state.currentArticle = updateArticleWithLikeStatus(article, state.likedArticleIds);
      } else {
        state.currentArticle = null;
      }
    },
    
    /**
     * Navigate to next article
     */
    navigateNext: (state) => {
      // Process insertion queue when user navigates (PERFECT TIMING!)
      if (state.insertionQueue.length > 0) {
        state.insertionQueue.forEach(({ sourceArticleId, similarArticles, insertPosition }) => {
          const safeInsertPosition = Math.min(insertPosition, state.allArticles.length);
          
          // 🔧 FIXED - Update similar articles with like status
          const updatedSimilarArticles = similarArticles.map(article => 
            updateArticleWithLikeStatus(article, state.likedArticleIds)
          );
          
          const newAllArticles = [
            ...state.allArticles.slice(0, safeInsertPosition),
            ...updatedSimilarArticles,
            ...state.allArticles.slice(safeInsertPosition)
          ];
          
          state.allArticles = newAllArticles;
          delete state.pendingSimilarRequests[sourceArticleId];
        });
        
        state.insertionQueue = [];
      }
      
      // Normal forward navigation
      if (state.currentIndex < state.allArticles.length - 1) {
        state.currentIndex += 1;
        const article = state.allArticles[state.currentIndex];
        
        // 🔧 FIXED - Create new object with like status
        state.currentArticle = updateArticleWithLikeStatus(article, state.likedArticleIds);
      }
    },
    
    /**
     * Navigate to previous article
     */
    navigatePrevious: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        const article = state.allArticles[state.currentIndex];
        
        // 🔧 FIXED - Create new object with like status
        state.currentArticle = updateArticleWithLikeStatus(article, state.likedArticleIds);
      }
    },
    
    setIsNavigating: (state, action: PayloadAction<boolean>) => {
      state.isNavigating = action.payload;
    },
    
    /**
     * 🔧 FIXED - Set all articles and sync liked status properly
     */
    setAllArticles: (state, action: PayloadAction<EnhancedArticle[]>) => {
      // Create new articles array with proper like status
      state.allArticles = action.payload.map(article => 
        updateArticleWithLikeStatus(article, state.likedArticleIds)
      );
      
      // Update current article if valid index
      if (state.currentIndex < state.allArticles.length) {
        state.currentArticle = state.allArticles[state.currentIndex];
      }
    },
    
    /**
     * 🔧 FIXED - Append new articles with proper like status
     */
    appendArticles: (state, action: PayloadAction<EnhancedArticle[]>) => {
      const existingIds = new Set(state.allArticles.map(a => a.article_id));
      const newArticles = action.payload
        .filter(a => !existingIds.has(a.article_id))
        .map(article => updateArticleWithLikeStatus(article, state.likedArticleIds));
      
      state.allArticles = [...state.allArticles, ...newArticles];
    },
    
    setNextCursor: (state, action: PayloadAction<string | null>) => {
      state.nextCursor = action.payload;
    },
    
    setViewMode: (state, action: PayloadAction<'single' | 'list'>) => {
      state.viewMode = action.payload;
    },
    
    setAutoMarkAsRead: (state, action: PayloadAction<boolean>) => {
      state.autoMarkAsRead = action.payload;
    },
    
    setArticlesPerPage: (state, action: PayloadAction<number>) => {
      state.articlesPerPage = action.payload;
    },
    
    setSelectedCategories: (state, action: PayloadAction<string[]>) => {
      state.selectedCategories = action.payload;
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    removeArticle: (state, action: PayloadAction<string>) => {
      const articleId = action.payload;
      state.allArticles = state.allArticles.filter(a => a.article_id !== articleId);
      
      // Remove from liked articles if present
      state.likedArticleIds = state.likedArticleIds.filter(id => id !== articleId);
      
      // Adjust current index if necessary
      if (state.currentIndex >= state.allArticles.length && state.allArticles.length > 0) {
        state.currentIndex = state.allArticles.length - 1;
        state.currentArticle = state.allArticles[state.currentIndex];
      }
    },
    
    resetNewsState: () => initialState,
    
    // ========================================================================
    // 🔧 FIXED - Like Actions (Now using arrays/objects instead of Set/Map)
    // ========================================================================
    
    /**
     * Start like toggle (optimistic update)
     */
    startLikeToggle: (state, action: PayloadAction<{
      articleId: string;
      isLiked: boolean;
      userCurrentIndex: number;
    }>) => {
      const { articleId, isLiked, userCurrentIndex } = action.payload;
      
      // 1. 🔧 FIXED - Update liked articles array
      if (isLiked) {
        if (!state.likedArticleIds.includes(articleId)) {
          state.likedArticleIds.push(articleId);
        }
      } else {
        state.likedArticleIds = state.likedArticleIds.filter(id => id !== articleId);
      }
      
      // 2. 🔧 FIXED - Update article in allArticles array (create new object)
      const articleIndex = state.allArticles.findIndex(a => a.article_id === articleId);
      if (articleIndex !== -1) {
        state.allArticles[articleIndex] = {
          ...state.allArticles[articleIndex],
          isLiked: isLiked,
          isLikeLoading: true
        };
      }
      
      // 3. 🔧 FIXED - Set loading state (object instead of Map)
      state.isLikeLoading[articleId] = true;
      
      // 4. Track pending request for similar articles (only when liking)
      if (isLiked) {
        state.pendingSimilarRequests[articleId] = {
          articleId,
          requestTime: Date.now(),
          insertPosition: userCurrentIndex + 1,
          userPositionWhenLiked: userCurrentIndex
        };
      }
      
      // 5. Update current article if it matches
      if (state.currentArticle?.article_id === articleId) {
        state.currentArticle = {
          ...state.currentArticle,
          isLiked: isLiked,
          isLikeLoading: true
        };
      }
    },
    
    /**
     * 🔧 FIXED - Complete like toggle
     */
    completeLikeToggle: (state, action: PayloadAction<{
      articleId: string;
      isLiked: boolean;
      success: boolean;
    }>) => {
      const { articleId, isLiked, success } = action.payload;
      
      // 1. Clear loading state
      delete state.isLikeLoading[articleId];
      
      // 2. Update article loading state
      const articleIndex = state.allArticles.findIndex(a => a.article_id === articleId);
      if (articleIndex !== -1) {
        const updatedArticle = {
          ...state.allArticles[articleIndex],
          isLikeLoading: false
        };
        
        // If API failed, revert optimistic update
        if (!success) {
          updatedArticle.isLiked = !isLiked;
          if (isLiked) {
            state.likedArticleIds = state.likedArticleIds.filter(id => id !== articleId);
          } else {
            if (!state.likedArticleIds.includes(articleId)) {
              state.likedArticleIds.push(articleId);
            }
          }
        }
        
        state.allArticles[articleIndex] = updatedArticle;
      }
      
      // 3. Update current article if it matches
      if (state.currentArticle?.article_id === articleId) {
        state.currentArticle = {
          ...state.currentArticle,
          isLikeLoading: false,
          isLiked: success ? isLiked : !isLiked
        };
      }
      
      // 4. If unliking, remove pending request
      if (!isLiked) {
        delete state.pendingSimilarRequests[articleId];
      }
    },
    
    // ========================================================================
    // 🔧 FIXED - Similar Articles Management
    // ========================================================================
    
    insertSimilarArticles: (state, action: PayloadAction<SimilarArticlesResult>) => {
      const { sourceArticleId, similarArticles, insertPosition } = action.payload;
      
      // Remove from pending requests
      delete state.pendingSimilarRequests[sourceArticleId];
      
      // Insert articles with proper like status
      const safeInsertPosition = Math.min(insertPosition, state.allArticles.length);
      const updatedSimilarArticles = similarArticles.map(article => 
        updateArticleWithLikeStatus(article, state.likedArticleIds)
      );
      
      const newAllArticles = [
        ...state.allArticles.slice(0, safeInsertPosition),
        ...updatedSimilarArticles,
        ...state.allArticles.slice(safeInsertPosition)
      ];
      
      state.allArticles = newAllArticles;
    },
    
    queueSimilarArticles: (state, action: PayloadAction<SimilarArticlesResult>) => {
      state.insertionQueue.push(action.payload);
    },
    
    processInsertionQueue: (state) => {
      state.insertionQueue.forEach(({ sourceArticleId, similarArticles, insertPosition }) => {
        const safeInsertPosition = Math.min(insertPosition, state.allArticles.length);
        const updatedSimilarArticles = similarArticles.map(article => 
          updateArticleWithLikeStatus(article, state.likedArticleIds)
        );
        
        const newAllArticles = [
          ...state.allArticles.slice(0, safeInsertPosition),
          ...updatedSimilarArticles,
          ...state.allArticles.slice(safeInsertPosition)
        ];
        
        state.allArticles = newAllArticles;
        delete state.pendingSimilarRequests[sourceArticleId];
      });
      
      state.insertionQueue = [];
    },
    
    clearPendingSimilarRequests: (state) => {
      state.pendingSimilarRequests = {};
      state.insertionQueue = [];
    },
    
    /**
     * 🔧 FIXED - Bulk set liked articles
     */
    setLikedArticles: (state, action: PayloadAction<string[]>) => {
      state.likedArticleIds = action.payload;
      
      // 🔧 FIXED - Update all articles with new like status
      state.allArticles = state.allArticles.map(article => 
        updateArticleWithLikeStatus(article, state.likedArticleIds)
      );
      
      // Update current article
      if (state.currentArticle) {
        state.currentArticle = updateArticleWithLikeStatus(state.currentArticle, state.likedArticleIds);
      }
    },
    
    /**
     * 🔧 FIXED - Sync liked status across all articles
     */
    syncLikedStatus: (state) => {
      // Update all articles
      state.allArticles = state.allArticles.map(article => 
        updateArticleWithLikeStatus(article, state.likedArticleIds)
      );
      
      // Update current article
      if (state.currentArticle) {
        state.currentArticle = updateArticleWithLikeStatus(state.currentArticle, state.likedArticleIds);
      }
    },
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

export const {
  // Existing actions
  setCurrentIndex,
  navigateNext,
  navigatePrevious,
  setIsNavigating,
  setAllArticles,
  appendArticles,
  setNextCursor,
  setViewMode,
  setAutoMarkAsRead,
  setArticlesPerPage,
  setSelectedCategories,
  setSearchQuery,
  removeArticle,
  resetNewsState,
  
  // Like actions
  startLikeToggle,
  completeLikeToggle,
  insertSimilarArticles,
  queueSimilarArticles,
  processInsertionQueue,
  clearPendingSimilarRequests,
  setLikedArticles,
  syncLikedStatus,
} = newsSlice.actions;

export default newsSlice.reducer;

// ============================================================================
// 🔧 FIXED SELECTORS (Updated for new data structures)
// ============================================================================

export const selectNews = (state: { news: NewsState }) => state.news;
export const selectCurrentArticle = (state: { news: NewsState }) => state.news.currentArticle;
export const selectCurrentIndex = (state: { news: NewsState }) => state.news.currentIndex;
export const selectAllArticles = (state: { news: NewsState }) => state.news.allArticles;
export const selectHasMoreArticles = (state: { news: NewsState }) => state.news.hasMoreArticles;
export const selectNextCursor = (state: { news: NewsState }) => state.news.nextCursor;
export const selectIsNavigating = (state: { news: NewsState }) => state.news.isNavigating;

// 🔧 FIXED - Like functionality selectors
export const selectLikedArticleIds = (state: { news: NewsState }) => state.news.likedArticleIds;
export const selectIsArticleLiked = (articleId: string) => (state: { news: NewsState }) => 
  state.news.likedArticleIds.includes(articleId);
export const selectIsLikeLoading = (articleId: string) => (state: { news: NewsState }) => 
  state.news.isLikeLoading[articleId] || false;
export const selectPendingSimilarRequests = (state: { news: NewsState }) => state.news.pendingSimilarRequests;
export const selectHasPendingRequests = (state: { news: NewsState }) => 
  Object.keys(state.news.pendingSimilarRequests).length > 0;