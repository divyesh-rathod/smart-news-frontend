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
  
  // 🆕 NEW - Like functionality
  likedArticleIds: Set<string>;                                    // Which articles are liked
  pendingSimilarRequests: Map<string, PendingSimilarRequest>;      // Ongoing API calls
  isLikeLoading: Map<string, boolean>;                            // Loading states per article
  
  // 🆕 NEW - Similar articles management
  similarArticlesQueue: EnhancedArticle[];                        // Queue of similar articles to insert
  insertionQueue: SimilarArticlesResult[];                        // Pending insertions
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
  
  // New like state
  likedArticleIds: new Set<string>(),
  pendingSimilarRequests: new Map<string, PendingSimilarRequest>(),
  isLikeLoading: new Map<string, boolean>(),
  
  // New similar articles state
  similarArticlesQueue: [],
  insertionQueue: [],
};

// ============================================================================
// REDUX SLICE
// ============================================================================

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    
    // ========================================================================
    // ✅ EXISTING ACTIONS (Enhanced with Like Status Syncing)
    // ========================================================================
    
    /**
     * Set current article index and sync liked status
     */
    
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
      state.currentArticle = state.allArticles[action.payload] || null;
      
      // ✅ Ensure current article has correct liked status
      if (state.currentArticle) {
        state.currentArticle.isLiked = state.likedArticleIds.has(state.currentArticle.article_id);
      }
    },
    
    navigateNext: (state) => {
      // 🎯 STEP 1: Process insertion queue when user navigates (PERFECT TIMING!)
      if (state.insertionQueue.length > 0) {
        console.log(`🚀 Processing ${state.insertionQueue.length} queued similar articles...`);
        
        state.insertionQueue.forEach(insertion => {
          const { sourceArticleId, similarArticles } = insertion;
          const safeInsertPosition = state.currentIndex + 1;
          
          // Insert similar articles after current position
          const newAllArticles = [
            ...state.allArticles.slice(0, safeInsertPosition),
            ...similarArticles,
            ...state.allArticles.slice(safeInsertPosition)
          ];
          
          state.allArticles = newAllArticles;
          state.pendingSimilarRequests.delete(sourceArticleId);
          
          console.log(`✨ Inserted ${similarArticles.length} similar articles from ${sourceArticleId}`);
        });
        
        // Clear queue after processing
        state.insertionQueue = [];
      }
      
      // 🎯 STEP 2: Normal navigation
      if (state.currentIndex < state.allArticles.length - 1) {
        state.currentIndex += 1;
        state.currentArticle = state.allArticles[state.currentIndex];
        
        // ✅ Ensure current article has correct liked status
        if (state.currentArticle) {
          state.currentArticle.isLiked = state.likedArticleIds.has(state.currentArticle.article_id);
        }
        
        console.log(`📰 Navigated to article ${state.currentIndex + 1}: ${state.currentArticle?.title}`);
      }
    },
    
    navigatePrevious: (state) => {
      // 🎯 Process queue if user goes back too (edge case but good UX)
      if (state.insertionQueue.length > 0) {
        console.log(`🔄 Processing queued articles on backward navigation...`);
        
        state.insertionQueue.forEach(insertion => {
          const { sourceArticleId, similarArticles } = insertion;
          const safeInsertPosition = state.currentIndex + 1;
          
          const newAllArticles = [
            ...state.allArticles.slice(0, safeInsertPosition),
            ...similarArticles,
            ...state.allArticles.slice(safeInsertPosition)
          ];
          
          state.allArticles = newAllArticles;
          state.pendingSimilarRequests.delete(sourceArticleId);
        });
        
        state.insertionQueue = [];
      }
      
      // Normal backward navigation
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        state.currentArticle = state.allArticles[state.currentIndex];
        
        // ✅ Ensure current article has correct liked status
        if (state.currentArticle) {
          state.currentArticle.isLiked = state.likedArticleIds.has(state.currentArticle.article_id);
        }
      }
    },
    
    setIsNavigating: (state, action: PayloadAction<boolean>) => {
      state.isNavigating = action.payload;
    },
    
    /**
     * Set all articles and sync liked status from Redux state
     */
    setAllArticles: (state, action: PayloadAction<EnhancedArticle[]>) => {
      state.allArticles = action.payload;
      
      // ✅ Sync liked status with articles when they are loaded
      state.allArticles.forEach(article => {
        article.isLiked = state.likedArticleIds.has(article.article_id);
      });
      
      if (state.currentIndex < action.payload.length) {
        state.currentArticle = state.allArticles[state.currentIndex];
      }
    },
    
    /**
     * Append new articles and sync liked status
     */
    
    appendArticles: (state, action: PayloadAction<EnhancedArticle[]>) => {
      const existingIds = new Set(state.allArticles.map(a => a.article_id));
      const newArticles = action.payload.filter(a => !existingIds.has(a.article_id));
      
      // ✅ Sync liked status with new articles
      newArticles.forEach(article => {
        article.isLiked = state.likedArticleIds.has(article.article_id);
      });
      
      state.allArticles = [...state.allArticles, ...newArticles];
    },
    
    setNextCursor: (state, action: PayloadAction<string | null>) => {
      state.nextCursor = action.payload;
      state.hasMoreArticles = action.payload !== null;
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
      const newArticles = state.allArticles.filter(a => a.article_id !== articleId);
      
      if (state.currentIndex >= newArticles.length && newArticles.length > 0) {
        state.currentIndex = newArticles.length - 1;
      }
      
      state.allArticles = newArticles;
      state.currentArticle = newArticles[state.currentIndex] || null;
    },
    
    resetNewsState: () => initialState,
    
    // ========================================================================
    // 🆕 NEW ACTIONS - Like Functionality
    // ========================================================================
    
    /**
     * Start like/unlike process (optimistic update)
     */
    startLikeToggle: (state, action: PayloadAction<{ 
      articleId: string; 
      isLiked: boolean;
      userCurrentIndex: number;
    }>) => {
      const { articleId, isLiked, userCurrentIndex } = action.payload;
      
      // 1. Optimistic update - toggle like status immediately
      if (isLiked) {
        state.likedArticleIds.add(articleId);
      } else {
        state.likedArticleIds.delete(articleId);
      }
      
      // 2. Update article in allArticles array
      const articleIndex = state.allArticles.findIndex(a => a.article_id === articleId);
      if (articleIndex !== -1) {
        state.allArticles[articleIndex].isLiked = isLiked;
        state.allArticles[articleIndex].isLikeLoading = true;
      }
      
      // 3. Set loading state
      state.isLikeLoading.set(articleId, true);
      
      // 4. Track pending request for similar articles (only when liking)
      if (isLiked) {
        state.pendingSimilarRequests.set(articleId, {
          articleId,
          requestTime: Date.now(),
          insertPosition: userCurrentIndex + 1, // Insert after current position
          userPositionWhenLiked: userCurrentIndex
        });
      }
    },
    
    /**
     * Complete like toggle (API response received)
     */
    completeLikeToggle: (state, action: PayloadAction<{
      articleId: string;
      isLiked: boolean;
      success: boolean;
    }>) => {
      const { articleId, isLiked, success } = action.payload;
      
      // 1. Clear loading state
      state.isLikeLoading.delete(articleId);
      
      // 2. Update article loading state
      const articleIndex = state.allArticles.findIndex(a => a.article_id === articleId);
      if (articleIndex !== -1) {
        state.allArticles[articleIndex].isLikeLoading = false;
        
        // If API failed, revert optimistic update
        if (!success) {
          state.allArticles[articleIndex].isLiked = !isLiked;
          if (isLiked) {
            state.likedArticleIds.delete(articleId);
          } else {
            state.likedArticleIds.add(articleId);
          }
        }
      }
      
      // 3. If unliking, remove pending request
      if (!isLiked) {
        state.pendingSimilarRequests.delete(articleId);
      }
    },
    
    // ========================================================================
    // 🆕 NEW ACTIONS - Similar Articles Management
    // ========================================================================
    
    /**
     * Insert similar articles into the reading queue immediately
     * USE CASE: When timing is perfect (user hasn't moved far from insertion point)
     */
    insertSimilarArticles: (state, action: PayloadAction<SimilarArticlesResult>) => {
      const { sourceArticleId, similarArticles, insertPosition } = action.payload;
      
      // 1. Remove from pending requests
      state.pendingSimilarRequests.delete(sourceArticleId);
      
      // 2. Find safe insertion point (user might have moved)
      let safeInsertPosition = Math.min(insertPosition, state.allArticles.length);
      
      // If user has moved past the insertion point, insert after current position
      if (state.currentIndex >= safeInsertPosition) {
        safeInsertPosition = state.currentIndex + 1;
      }
      
      // 3. Insert similar articles at the calculated position
      const newAllArticles = [
        ...state.allArticles.slice(0, safeInsertPosition),
        ...similarArticles,
        ...state.allArticles.slice(safeInsertPosition)
      ];
      
      state.allArticles = newAllArticles;
      
      // 4. Update current article reference (index stays same, but array changed)
      state.currentArticle = state.allArticles[state.currentIndex] || null;
      
      console.log(`🎯 Inserted ${similarArticles.length} similar articles at position ${safeInsertPosition}`);
    },
    
    /**
     * Queue similar articles for insertion during next navigation
     * USE CASE: When user has moved far from original insertion point
     * Articles will be automatically inserted when user navigates next
     */
    queueSimilarArticles: (state, action: PayloadAction<SimilarArticlesResult>) => {
      state.insertionQueue.push(action.payload);
      console.log(`📥 Queued ${action.payload.similarArticles.length} similar articles for next navigation`);
    },
    
    /**
     * Process queued similar articles insertions (Manual trigger - rarely needed)
     * NOTE: Queue is automatically processed during navigation (navigateNext/Previous)
     * This is mainly for edge cases or manual control
     */
    processInsertionQueue: (state) => {
      // Process all queued insertions
      state.insertionQueue.forEach(insertion => {
        const { sourceArticleId, similarArticles } = insertion;
        const safeInsertPosition = state.currentIndex + 1;
        
        const newAllArticles = [
          ...state.allArticles.slice(0, safeInsertPosition),
          ...similarArticles,
          ...state.allArticles.slice(safeInsertPosition)
        ];
        
        state.allArticles = newAllArticles;
        state.pendingSimilarRequests.delete(sourceArticleId);
      });
      
      // Clear queue
      state.insertionQueue = [];
      
      // Update current article reference
      state.currentArticle = state.allArticles[state.currentIndex] || null;
    },
    
    /**
     * Clear pending similar requests (cleanup)
     */
    clearPendingSimilarRequests: (state) => {
      state.pendingSimilarRequests.clear();
      state.insertionQueue = [];
    },
    
    /**
     * Bulk set liked articles (for persistence restoration)
     */
    setLikedArticles: (state, action: PayloadAction<string[]>) => {
      state.likedArticleIds = new Set(action.payload);
      
      // Sync liked status across all articles using the helper function
      // Update all articles
      state.allArticles.forEach(article => {
        article.isLiked = state.likedArticleIds.has(article.article_id);
      });
      
      // Update current article
      if (state.currentArticle) {
        state.currentArticle.isLiked = state.likedArticleIds.has(state.currentArticle.article_id);
      }
    },
    /**
     * Sync liked status across all articles and current article
     * Useful after bulk updates or state restoration
     */
    syncLikedStatus: (state) => {
      // Update all articles
      state.allArticles.forEach(article => {
        article.isLiked = state.likedArticleIds.has(article.article_id);
      });
      
      // Update current article
      if (state.currentArticle) {
        state.currentArticle.isLiked = state.likedArticleIds.has(state.currentArticle.article_id);
      }
    },
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

// Export actions
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
  
  // New like actions
  startLikeToggle,
  completeLikeToggle,
  insertSimilarArticles,
  queueSimilarArticles,
  processInsertionQueue,
  clearPendingSimilarRequests,
  setLikedArticles,
  syncLikedStatus,
} = newsSlice.actions;

// Export reducer
export default newsSlice.reducer;

// ============================================================================
// SELECTORS (Enhanced with Like Data)
// ============================================================================

export const selectNews = (state: { news: NewsState }) => state.news;
export const selectCurrentArticle = (state: { news: NewsState }) => state.news.currentArticle;
export const selectCurrentIndex = (state: { news: NewsState }) => state.news.currentIndex;
export const selectAllArticles = (state: { news: NewsState }) => state.news.allArticles;
export const selectHasMoreArticles = (state: { news: NewsState }) => state.news.hasMoreArticles;
export const selectNextCursor = (state: { news: NewsState }) => state.news.nextCursor;
export const selectIsNavigating = (state: { news: NewsState }) => state.news.isNavigating;

// 🆕 NEW SELECTORS - Like functionality
export const selectLikedArticleIds = (state: { news: NewsState }) => state.news.likedArticleIds;
export const selectIsArticleLiked = (articleId: string) => (state: { news: NewsState }) => 
  state.news.likedArticleIds.has(articleId);
export const selectIsLikeLoading = (articleId: string) => (state: { news: NewsState }) => 
  state.news.isLikeLoading.get(articleId) || false;
export const selectPendingSimilarRequests = (state: { news: NewsState }) => state.news.pendingSimilarRequests;
export const selectHasPendingRequests = (state: { news: NewsState }) => state.news.pendingSimilarRequests.size > 0;