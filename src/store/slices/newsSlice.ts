// src/store/slices/newsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Article } from '../../types/articleTypes';

interface NewsState {
  // Article navigation
  currentIndex: number;
  currentArticle: Article | null;
  
  // Pagination state
  nextCursor: string | null;
  hasMoreArticles: boolean;
  
  // UI state
  isNavigating: boolean;
  viewMode: 'single' | 'list'; // For future list view toggle
  
  // Reading preferences
  articlesPerPage: number;
  autoMarkAsRead: boolean;
  
  // Cache for merged articles (from multiple API calls)
  allArticles: Article[];
  
  // Filters (for future filtering features)
  selectedCategories: string[];
  searchQuery: string;
}

const initialState: NewsState = {
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
};

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    // Navigation actions
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
      state.currentArticle = state.allArticles[action.payload] || null;
    },
    
    navigateNext: (state) => {
      if (state.currentIndex < state.allArticles.length - 1) {
        state.currentIndex += 1;
        state.currentArticle = state.allArticles[state.currentIndex];
      }
    },
    
    navigatePrevious: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
        state.currentArticle = state.allArticles[state.currentIndex];
      }
    },
    
    setIsNavigating: (state, action: PayloadAction<boolean>) => {
      state.isNavigating = action.payload;
    },
    
    // Article management
    setAllArticles: (state, action: PayloadAction<Article[]>) => {
      state.allArticles = action.payload;
      // Set current article if index is valid
      if (state.currentIndex < action.payload.length) {
        state.currentArticle = action.payload[state.currentIndex];
      }
    },
    
    appendArticles: (state, action: PayloadAction<Article[]>) => {
      // Prevent duplicates
      const existingIds = new Set(state.allArticles.map(a => a.article_id));
      const newArticles = action.payload.filter(a => !existingIds.has(a.article_id));
      
      state.allArticles = [...state.allArticles, ...newArticles];
    },
    
    // Pagination
    setNextCursor: (state, action: PayloadAction<string | null>) => {
      state.nextCursor = action.payload;
      state.hasMoreArticles = action.payload !== null;
    },
    
    // UI preferences
    setViewMode: (state, action: PayloadAction<'single' | 'list'>) => {
      state.viewMode = action.payload;
    },
    
    setAutoMarkAsRead: (state, action: PayloadAction<boolean>) => {
      state.autoMarkAsRead = action.payload;
    },
    
    setArticlesPerPage: (state, action: PayloadAction<number>) => {
      state.articlesPerPage = action.payload;
    },
    
    // Filters (for future features)
    setSelectedCategories: (state, action: PayloadAction<string[]>) => {
      state.selectedCategories = action.payload;
    },
    
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    
    // Remove read article from list (optional)
    removeArticle: (state, action: PayloadAction<string>) => {
      const articleId = action.payload;
      const newArticles = state.allArticles.filter(a => a.article_id !== articleId);
      
      // Adjust current index if needed
      if (state.currentIndex >= newArticles.length && newArticles.length > 0) {
        state.currentIndex = newArticles.length - 1;
      }
      
      state.allArticles = newArticles;
      state.currentArticle = newArticles[state.currentIndex] || null;
    },
    
    // Reset state (for logout or refresh)
    resetNewsState: () => initialState,
  },
});

// Export actions
export const {
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
} = newsSlice.actions;

// Export reducer
export default newsSlice.reducer;

// Selectors
export const selectNews = (state: { news: NewsState }) => state.news;
export const selectCurrentArticle = (state: { news: NewsState }) => state.news.currentArticle;
export const selectCurrentIndex = (state: { news: NewsState }) => state.news.currentIndex;
export const selectAllArticles = (state: { news: NewsState }) => state.news.allArticles;
export const selectHasMoreArticles = (state: { news: NewsState }) => state.news.hasMoreArticles;
export const selectNextCursor = (state: { news: NewsState }) => state.news.nextCursor;
export const selectIsNavigating = (state: { news: NewsState }) => state.news.isNavigating;