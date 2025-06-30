// src/hooks/useNews.ts
import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  useGetUnseenArticlesQuery,
  useLazyGetUnseenArticlesQuery,
  useMarkArticleAsReadMutation,
  useToggleArticleLikeMutation,
} from '../store/api/newsApi';
import {
  setCurrentIndex,
  navigateNext,
  navigatePrevious,
  setIsNavigating,
  setAllArticles,
  appendArticles,
  setNextCursor,
  startLikeToggle,
  completeLikeToggle,
  insertSimilarArticles,
  queueSimilarArticles,
  processInsertionQueue,
  syncLikedStatus,
  selectNews,
  selectCurrentArticle,
  selectCurrentIndex,
  selectAllArticles,
  selectHasMoreArticles,
  selectNextCursor,
  selectLikedArticleIds,
  selectIsArticleLiked,
  selectIsLikeLoading,
  selectPendingSimilarRequests,
  selectHasPendingRequests,
} from '../store/slices/newsSlice';
import type { EnhancedArticle, ToggleLikeResponse } from '../types/articleTypes';

// ============================================================================
// ENHANCED useNews HOOK
// ============================================================================

export const useNews = () => {
  const dispatch = useAppDispatch();
  
  // ========================================================================
  // REDUX SELECTORS - Article State
  // ========================================================================
  
  const newsState = useAppSelector(selectNews);
  const currentArticle = useAppSelector(selectCurrentArticle);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const allArticles = useAppSelector(selectAllArticles);
  const hasMoreArticles = useAppSelector(selectHasMoreArticles);
  const nextCursor = useAppSelector(selectNextCursor);
  
  // ========================================================================
  // REDUX SELECTORS - Like State  
  // ========================================================================
  
  const likedArticleIds = useAppSelector(selectLikedArticleIds);
  const hasPendingRequests = useAppSelector(selectHasPendingRequests);
  const pendingSimilarRequests = useAppSelector(selectPendingSimilarRequests);
  
  // Get current article like loading state (hooks must be at top level)
  const currentArticleLikeLoading = useAppSelector(state => 
    currentArticle ? selectIsLikeLoading(currentArticle.article_id)(state) : false
  );
  
  // Note: We can't get loading state for arbitrary articles due to React hooks rules
  // Loading states are only tracked for the current article to avoid performance issues
  
  // ========================================================================
  // RTK QUERY HOOKS - API Calls
  // ========================================================================
  
  const {
    data: initialArticlesData,
    isLoading: isInitialLoading,
    error: initialError,
  } = useGetUnseenArticlesQuery({ limit: 20 });
  
  const [fetchMoreArticles, { 
    isLoading: isLoadingMore, 
    error: loadMoreError 
  }] = useLazyGetUnseenArticlesQuery();
  
  const [markAsRead, { 
    isLoading: isMarkingAsRead 
  }] = useMarkArticleAsReadMutation();
  
  const [toggleLikeMutation, { 
    isLoading: isTogglingLike 
  }] = useToggleArticleLikeMutation();

  // ========================================================================
  // REFS FOR AUTO-READ FUNCTIONALITY
  // ========================================================================
  
  const readTimerRef = useRef<number | null>(null);
  const currentArticleIdRef = useRef<string | null>(null);
  const hasMarkedAsReadRef = useRef<Set<string>>(new Set());

  // ========================================================================
  // INITIAL ARTICLES LOADING
  // ========================================================================
  
  useEffect(() => {
    if (initialArticlesData?.results && allArticles.length === 0) {
      console.log('📥 Loading initial articles:', initialArticlesData.results.length);
      dispatch(setAllArticles(initialArticlesData.results));
      dispatch(setNextCursor(initialArticlesData.next_cursor));
    }
  }, [initialArticlesData, allArticles.length, dispatch]);

  // ========================================================================
  // AUTO-READ TIMER MANAGEMENT
  // ========================================================================
  
  const startReadTimer = useCallback((article: EnhancedArticle, delayMs: number = 30000) => {
    if (!newsState.autoMarkAsRead) return;
    if (hasMarkedAsReadRef.current.has(article.article_id)) return;
    
    console.log(`⏱️ Starting read timer for ${article.article_id} (${delayMs}ms)`);
    
    readTimerRef.current = window.setTimeout(async () => {
      if (currentArticleIdRef.current === article.article_id) {
        try {
          console.log(`✅ Auto-marking ${article.article_id} as read`);
          await markAsRead(article.article_id).unwrap();
          hasMarkedAsReadRef.current.add(article.article_id);
        } catch (error) {
          console.error('❌ Failed to auto-mark article as read:', error);
        }
      }
    }, delayMs);
  }, [newsState.autoMarkAsRead, markAsRead]);

  const stopReadTimer = useCallback((shouldMarkAsRead: boolean = false) => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
      
      if (shouldMarkAsRead && currentArticle && !hasMarkedAsReadRef.current.has(currentArticle.article_id)) {
        markArticleAsRead(currentArticle.article_id);
      }
    }
  }, [currentArticle]);

  const pauseReadTimer = useCallback(() => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
    }
  }, []);

  const resumeReadTimer = useCallback(() => {
    if (currentArticle && newsState.autoMarkAsRead) {
      startReadTimer(currentArticle, 15000); // Resume with shorter delay
    }
  }, [currentArticle, newsState.autoMarkAsRead, startReadTimer]);

  // ========================================================================
  // ARTICLE NAVIGATION (Enhanced with Queue Processing)
  // ========================================================================
  
  const goToNext = useCallback(() => {
    if (newsState.isNavigating) return;
    
    stopReadTimer(true);
    
    dispatch(setIsNavigating(true));
    setTimeout(() => dispatch(setIsNavigating(false)), 300);
    
    // 🎯 Navigation automatically processes queue in Redux slice
    dispatch(navigateNext());
    
    // Auto-fetch more articles when near the end
    if (currentIndex >= allArticles.length - 3 && hasMoreArticles && nextCursor) {
      fetchMoreArticles({ cursor: nextCursor, limit: 20 })
        .unwrap()
        .then((data) => {
          dispatch(appendArticles(data.results));
          dispatch(setNextCursor(data.next_cursor));
        })
        .catch((error) => {
          console.error('❌ Failed to fetch more articles:', error);
        });
    }
  }, [
    newsState.isNavigating,
    currentIndex,
    allArticles.length,
    hasMoreArticles,
    nextCursor,
    dispatch,
    fetchMoreArticles,
    stopReadTimer,
  ]);

  const goToPrevious = useCallback(() => {
    if (newsState.isNavigating) return;
    
    stopReadTimer(true);
    
    dispatch(setIsNavigating(true));
    setTimeout(() => dispatch(setIsNavigating(false)), 300);
    
    // 🎯 Navigation automatically processes queue in Redux slice
    dispatch(navigatePrevious());
  }, [newsState.isNavigating, dispatch, stopReadTimer]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < allArticles.length) {
      stopReadTimer(true);
      dispatch(setCurrentIndex(index));
    }
  }, [allArticles.length, dispatch, stopReadTimer]);

  // ========================================================================
  // LIKE FUNCTIONALITY (New!)
  // ========================================================================
  
  /**
   * Toggle like status for an article
   * Handles optimistic updates, API calls, and similar articles insertion
   */
  const toggleArticleLike = useCallback(async (articleId?: string): Promise<ToggleLikeResponse | null> => {
    const targetArticleId = articleId || currentArticle?.article_id;
    if (!targetArticleId) {
      console.warn('⚠️ No article ID provided for like toggle');
      return null;
    }
    
    const currentlyLiked = likedArticleIds.has(targetArticleId);
    const newLikedState = !currentlyLiked;
    
    console.log(`${newLikedState ? '❤️' : '💔'} Toggling like for ${targetArticleId}: ${currentlyLiked} → ${newLikedState}`);
    
    try {
      // The mutation handles optimistic updates automatically via onQueryStarted
      const result = await toggleLikeMutation({ 
        articleId: targetArticleId, 
        userCurrentIndex: currentIndex 
      }).unwrap();
      
      console.log('✅ Like toggle successful:', result.apiResponse);
      
      // Return the API response for components that want to show similar articles
      return result.apiResponse;
      
    } catch (error) {
      console.error('❌ Like toggle failed:', error);
      throw error;
    }
  }, [currentArticle, likedArticleIds, currentIndex, toggleLikeMutation]);

  /**
   * Simple check if any article is liked (no loading state)
   * Use this for bulk operations or when you only need like status
   */
  const isArticleLiked = useCallback((articleId: string) => {
    return likedArticleIds.has(articleId);
  }, [likedArticleIds]);

  /**
   * Get like status for a specific article
   * Note: For performance, this only works reliably for the current article.
   * For other articles, use the likedArticleIds Set directly.
   */
  const getArticleLikeStatus = useCallback((articleId: string) => {
    return {
      isLiked: likedArticleIds.has(articleId),
      isLoading: currentArticle?.article_id === articleId ? currentArticleLikeLoading : false,
    };
  }, [likedArticleIds, currentArticle?.article_id, currentArticleLikeLoading]);

  /**
   * Get like status for current article
   */
  const getCurrentArticleLikeStatus = useCallback(() => {
    if (!currentArticle) return { isLiked: false, isLoading: false };
    return {
      isLiked: likedArticleIds.has(currentArticle.article_id),
      isLoading: currentArticleLikeLoading,
    };
  }, [currentArticle, likedArticleIds, currentArticleLikeLoading]);

  // ========================================================================
  // ARTICLE ACTIONS (Enhanced)
  // ========================================================================
  
  const markArticleAsRead = useCallback(async (articleId?: string) => {
    const id = articleId || currentArticle?.article_id;
    if (!id) return;
    
    try {
      await markAsRead(id).unwrap();
      hasMarkedAsReadRef.current.add(id);
      
      if (currentArticleIdRef.current === id) {
        stopReadTimer(false);
      }
      
      if (newsState.autoMarkAsRead && currentIndex < allArticles.length - 1) {
        setTimeout(() => goToNext(), 500);
      }
    } catch (error) {
      console.error('❌ Failed to mark article as read:', error);
    }
  }, [currentArticle, markAsRead, newsState.autoMarkAsRead, currentIndex, allArticles.length, goToNext, stopReadTimer]);

  // ========================================================================
  // SIMILAR ARTICLES MANAGEMENT
  // ========================================================================
  
  /**
   * Manually process queued similar articles (rarely needed)
   */
  const processQueuedSimilarArticles = useCallback(() => {
    console.log('🔄 Manually processing queued similar articles');
    dispatch(processInsertionQueue());
  }, [dispatch]);

  /**
   * Get information about pending similar article requests
   */
  const getPendingRequestsInfo = useCallback(() => {
    return {
      count: pendingSimilarRequests.size,
      articleIds: Array.from(pendingSimilarRequests.keys()),
      hasPending: hasPendingRequests
    };
  }, [pendingSimilarRequests, hasPendingRequests]);

  // ========================================================================
  // KEYBOARD NAVIGATION
  // ========================================================================
  
  const setupKeyboardNavigation = useCallback(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }
      
      switch (event.key) {
        case 'ArrowLeft':
        case 'h':
          event.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
        case 'l':
          event.preventDefault();
          goToNext();
          break;
        case 'r':
          event.preventDefault();
          if (currentArticle) markArticleAsRead();
          break;
        case 'f':
        case ' ':
          event.preventDefault();
          if (currentArticle) toggleArticleLike();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, markArticleAsRead, toggleArticleLike, currentArticle]);

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  
  const refreshArticles = useCallback(async () => {
    try {
      const data = await fetchMoreArticles({ limit: 20, offset: 0 }).unwrap();
      dispatch(setAllArticles(data.results));
      dispatch(setNextCursor(data.next_cursor));
      dispatch(setCurrentIndex(0));
    } catch (error) {
      console.error('❌ Failed to refresh articles:', error);
    }
  }, [fetchMoreArticles, dispatch]);

  // ========================================================================
  // ARTICLE TIMER EFFECTS
  // ========================================================================
  
  useEffect(() => {
    if (currentArticle) {
      currentArticleIdRef.current = currentArticle.article_id;
      
      if (newsState.autoMarkAsRead && !hasMarkedAsReadRef.current.has(currentArticle.article_id)) {
        startReadTimer(currentArticle);
      }
    }
    
    return () => {
      if (readTimerRef.current) {
        clearTimeout(readTimerRef.current);
        readTimerRef.current = null;
      }
    };
  }, [currentArticle, newsState.autoMarkAsRead, startReadTimer]);

  // ========================================================================
  // SYNC LIKED STATUS ON MOUNT
  // ========================================================================
  
  useEffect(() => {
    // Ensure liked status is synced when hook mounts
    if (allArticles.length > 0) {
      dispatch(syncLikedStatus());
    }
  }, [dispatch, allArticles.length]);

  // ========================================================================
  // RETURN HOOK API
  // ========================================================================
  
  return {
  
    currentArticle,
    currentIndex,
    allArticles,
    hasMoreArticles,
    totalArticles: allArticles.length,
    
    
    isInitialLoading,
    isLoadingMore,
    isMarkingAsRead,
    isTogglingLike,
    isNavigating: newsState.isNavigating,
    

    error: initialError || loadMoreError,
    
  
    goToNext,
    goToPrevious,
    goToIndex,
    canGoNext: currentIndex < allArticles.length - 1,
    canGoPrevious: currentIndex > 0,
    
   
    markArticleAsRead,
    toggleArticleLike,
    
    
    getCurrentArticleLikeStatus,
    getArticleLikeStatus,
    isArticleLiked,
    likedArticleIds,
    currentArticleLikeLoading,
    
  
    processQueuedSimilarArticles,
    getPendingRequestsInfo,
    hasPendingRequests,
    pendingSimilarRequests,
    

    pauseReadTimer,
    resumeReadTimer,
    

    setupKeyboardNavigation,
    refreshArticles,
    

    progress: allArticles.length > 0 ? ((currentIndex + 1) / allArticles.length) * 100 : 0,
  };
};