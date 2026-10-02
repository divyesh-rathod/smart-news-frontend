// src/store/slices/newsSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { EnhancedArticle } from '../../types/articleTypes';

// ============================================================================
// STATE
// ============================================================================

interface NewsState {
  // Article navigation
  currentIndex: number;
  currentArticle: EnhancedArticle | null;
  isNavigating: boolean;

  // Reading list and the cursor for its next page
  allArticles: EnhancedArticle[];
  nextCursor: string | null;

  // Likes: the server's state as far as this client knows, updated optimistically
  likedArticleIds: string[];
  // In-flight like requests, at most one per article, with the state to restore if it fails
  likeRequests: Record<string, { previouslyLiked: boolean }>;
  likeError: string | null;
}

const initialState: NewsState = {
  currentIndex: 0,
  currentArticle: null,
  isNavigating: false,
  allArticles: [],
  nextCursor: null,
  likedArticleIds: [],
  likeRequests: {},
  likeError: null,
};

// ============================================================================
// HELPERS
// ============================================================================

const setLiked = (state: NewsState, articleId: string, liked: boolean) => {
  const isLiked = state.likedArticleIds.includes(articleId);
  if (liked && !isLiked) {
    state.likedArticleIds.push(articleId);
  } else if (!liked && isLiked) {
    state.likedArticleIds = state.likedArticleIds.filter((id) => id !== articleId);
  }
};

/** Feed pages carry the server's like state. It wins, except for an article with a request in flight. */
const applyServerLikes = (state: NewsState, articles: EnhancedArticle[]) => {
  for (const article of articles) {
    if (!(article.article_id in state.likeRequests)) {
      setLiked(state, article.article_id, article.liked);
    }
  }
};

// ============================================================================
// SLICE
// ============================================================================

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
      state.currentArticle = state.allArticles[action.payload] ?? null;
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

    setAllArticles: (state, action: PayloadAction<EnhancedArticle[]>) => {
      state.allArticles = action.payload;
      applyServerLikes(state, action.payload);
      if (state.currentIndex < state.allArticles.length) {
        state.currentArticle = state.allArticles[state.currentIndex];
      }
    },

    appendArticles: (state, action: PayloadAction<EnhancedArticle[]>) => {
      const existingIds = new Set(state.allArticles.map((a) => a.article_id));
      const newArticles = action.payload.filter((a) => !existingIds.has(a.article_id));
      applyServerLikes(state, newArticles);
      state.allArticles.push(...newArticles);
    },

    setNextCursor: (state, action: PayloadAction<string | null>) => {
      state.nextCursor = action.payload;
    },

    resetNewsState: () => initialState,

    // ------------------------------------------------------------------------
    // Likes
    // ------------------------------------------------------------------------

    /** Optimistic: show the new state at once and remember what to restore on failure. */
    likeRequested: (state, action: PayloadAction<{ articleId: string; liked: boolean }>) => {
      const { articleId, liked } = action.payload;
      state.likeRequests[articleId] = { previouslyLiked: state.likedArticleIds.includes(articleId) };
      setLiked(state, articleId, liked);
      state.likeError = null;
    },

    /** The server's answer is what the user sees from now on. */
    likeSucceeded: (state, action: PayloadAction<{ articleId: string; liked: boolean }>) => {
      const { articleId, liked } = action.payload;
      delete state.likeRequests[articleId];
      setLiked(state, articleId, liked);
    },

    likeFailed: (state, action: PayloadAction<{ articleId: string; message: string }>) => {
      const { articleId, message } = action.payload;
      const request = state.likeRequests[articleId];
      if (request) {
        setLiked(state, articleId, request.previouslyLiked);
        delete state.likeRequests[articleId];
      }
      state.likeError = message;
    },

    dismissLikeError: (state) => {
      state.likeError = null;
    },

    /**
     * Put a like's recommendations right after the article being read now, which may be later than the
     * liked one if the reader moved on while waiting. Articles already in the list aren't added again.
     */
    recommendationsArrived: (state, action: PayloadAction<{ sourceArticleId: string; articles: EnhancedArticle[] }>) => {
      const { sourceArticleId, articles } = action.payload;
      if (!state.likedArticleIds.includes(sourceArticleId)) return;

      const present = new Set(state.allArticles.map((a) => a.article_id));
      const fresh: EnhancedArticle[] = [];
      for (const article of articles) {
        if (!present.has(article.article_id)) {
          present.add(article.article_id);
          fresh.push(article);
        }
      }
      state.allArticles.splice(state.currentIndex + 1, 0, ...fresh);
    },
  },
});

export const {
  setCurrentIndex,
  navigateNext,
  navigatePrevious,
  setIsNavigating,
  setAllArticles,
  appendArticles,
  setNextCursor,
  resetNewsState,
  likeRequested,
  likeSucceeded,
  likeFailed,
  dismissLikeError,
  recommendationsArrived,
} = newsSlice.actions;

export default newsSlice.reducer;

// ============================================================================
// SELECTORS
// ============================================================================

type State = { news: NewsState };

export const selectCurrentArticle = (state: State) => state.news.currentArticle;
export const selectCurrentIndex = (state: State) => state.news.currentIndex;
export const selectAllArticles = (state: State) => state.news.allArticles;
export const selectNextCursor = (state: State) => state.news.nextCursor;
export const selectIsNavigating = (state: State) => state.news.isNavigating;
export const selectLikedArticleIds = (state: State) => state.news.likedArticleIds;
export const selectLikeError = (state: State) => state.news.likeError;
export const selectIsLikePending = (articleId: string | undefined) => (state: State) =>
  articleId !== undefined && articleId in state.news.likeRequests;
