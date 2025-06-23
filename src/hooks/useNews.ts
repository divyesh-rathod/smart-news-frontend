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
  selectNews,
  selectCurrentArticle,
  selectCurrentIndex,
  selectAllArticles,
  selectHasMoreArticles,
  selectNextCursor,
} from '../store/slices/newsSlice';
import type { Article } from '../types/articleTypes';

export const useNews = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const newsState = useAppSelector(selectNews);
  const currentArticle = useAppSelector(selectCurrentArticle);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const allArticles = useAppSelector(selectAllArticles);
  const hasMoreArticles = useAppSelector(selectHasMoreArticles);
  const nextCursor = useAppSelector(selectNextCursor);
  
  // API hooks
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
  
  const [toggleLike, { 
    isLoading: isTogglingLike 
  }] = useToggleArticleLikeMutation();

  // Auto mark-as-read functionality
  const readTimerRef = useRef<number | null>(null);
  const currentArticleIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasMarkedAsReadRef = useRef<Set<string>>(new Set());

  // Auto mark article as read after 10 seconds
  const startReadTimer = useCallback((articleId: string) => {
    // Clear any existing timer
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
    }

    // Don't start timer if already marked as read
    if (hasMarkedAsReadRef.current.has(articleId)) {
      return;
    }

    // Set current article tracking
    currentArticleIdRef.current = articleId;
    startTimeRef.current = Date.now();

    // Start 10-second timer
    readTimerRef.current = setTimeout(async () => {
      // Double check we're still on the same article
      if (currentArticleIdRef.current === articleId && !hasMarkedAsReadRef.current.has(articleId)) {
        try {
          console.log(`Auto-marking article ${articleId} as read after 10 seconds`);
          await markAsRead(articleId).unwrap();
          hasMarkedAsReadRef.current.add(articleId);
        } catch (error) {
          console.error('Failed to auto-mark article as read:', error);
        }
      }
    }, 10000); // 10 seconds

  }, [markAsRead]);

  // Stop the read timer and optionally mark as read if enough time has passed
  const stopReadTimer = useCallback((shouldCheckTime: boolean = false) => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
    }

    // If we should check time and enough time has passed, mark as read
    if (shouldCheckTime && 
        currentArticleIdRef.current && 
        startTimeRef.current && 
        !hasMarkedAsReadRef.current.has(currentArticleIdRef.current)) {
      
      const timeSpent = Date.now() - startTimeRef.current;
      
      if (timeSpent >= 10000) { // 10 seconds
        const articleId = currentArticleIdRef.current;
        markAsRead(articleId)
          .unwrap()
          .then(() => {
            console.log(`Auto-marked article ${articleId} as read (spent ${Math.round(timeSpent/1000)}s)`);
            hasMarkedAsReadRef.current.add(articleId);
          })
          .catch((error) => {
            console.error('Failed to auto-mark article as read on navigation:', error);
          });
      }
    }

    // Reset tracking
    currentArticleIdRef.current = null;
    startTimeRef.current = null;
  }, [markAsRead]);

  // Initialize articles on first load
  useEffect(() => {
    if (initialArticlesData && allArticles.length === 0) {
      dispatch(setAllArticles(initialArticlesData.results));
      dispatch(setNextCursor(initialArticlesData.next_cursor));
    }
  }, [initialArticlesData, allArticles.length, dispatch]);

  // Start read timer when current article changes
  useEffect(() => {
    if (currentArticle?.article_id) {
      // Stop previous timer and check if should mark previous article
      stopReadTimer(true);
      
      // Start new timer for current article
      startReadTimer(currentArticle.article_id);
    }

    // Cleanup function
    return () => {
      stopReadTimer(false);
    };
  }, [currentArticle?.article_id, startReadTimer, stopReadTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (readTimerRef.current) {
        clearTimeout(readTimerRef.current);
      }
    };
  }, []);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (newsState.isNavigating) return;
    
    // Stop current timer and check if should mark as read
    stopReadTimer(true);
    
    dispatch(setIsNavigating(true));
    setTimeout(() => dispatch(setIsNavigating(false)), 300);
    
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
          console.error('Failed to fetch more articles:', error);
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
    
    // Stop current timer and check if should mark as read
    stopReadTimer(true);
    
    dispatch(setIsNavigating(true));
    setTimeout(() => dispatch(setIsNavigating(false)), 300);
    
    dispatch(navigatePrevious());
  }, [newsState.isNavigating, dispatch, stopReadTimer]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < allArticles.length) {
      // Stop current timer and check if should mark as read
      stopReadTimer(true);
      
      dispatch(setCurrentIndex(index));
    }
  }, [allArticles.length, dispatch, stopReadTimer]);

  // Article actions
  const markArticleAsRead = useCallback(async (articleId?: string) => {
    const id = articleId || currentArticle?.article_id;
    if (!id) return;
    
    try {
      await markAsRead(id).unwrap();
      hasMarkedAsReadRef.current.add(id);
      
      // Stop timer since we manually marked it
      if (currentArticleIdRef.current === id) {
        stopReadTimer(false);
      }
      
      // Optionally auto-navigate to next article
      if (newsState.autoMarkAsRead && currentIndex < allArticles.length - 1) {
        setTimeout(() => goToNext(), 500);
      }
    } catch (error) {
      console.error('Failed to mark article as read:', error);
    }
  }, [currentArticle, markAsRead, newsState.autoMarkAsRead, currentIndex, allArticles.length, goToNext, stopReadTimer]);

  const toggleArticleLike = useCallback(async (articleId?: string) => {
    const id = articleId || currentArticle?.article_id;
    if (!id) return null;
    
    try {
      const result = await toggleLike(id).unwrap();
      return result;
    } catch (error) {
      console.error('Failed to toggle article like:', error);
      throw error;
    }
  }, [currentArticle, toggleLike]);

  // Keyboard navigation setup
  const setupKeyboardNavigation = useCallback(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        markArticleAsRead();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [goToNext, goToPrevious, markArticleAsRead]);

  // Manual refresh function
  const refreshArticles = useCallback(async () => {
    try {
      // Stop current timer
      stopReadTimer(false);
      
      const data = await fetchMoreArticles({ limit: 20 }).unwrap();
      dispatch(setAllArticles(data.results));
      dispatch(setNextCursor(data.next_cursor));
      dispatch(setCurrentIndex(0));
      
      // Clear the marked articles set on refresh
      hasMarkedAsReadRef.current.clear();
    } catch (error) {
      console.error('Failed to refresh articles:', error);
    }
  }, [fetchMoreArticles, dispatch, stopReadTimer]);

  // Pause/Resume read timer (useful for when user switches tabs)
  const pauseReadTimer = useCallback(() => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
    }
  }, []);

  const resumeReadTimer = useCallback(() => {
    if (currentArticle?.article_id && 
        currentArticleIdRef.current === currentArticle.article_id && 
        startTimeRef.current && 
        !hasMarkedAsReadRef.current.has(currentArticle.article_id)) {
      
      const timeAlreadySpent = Date.now() - startTimeRef.current;
      const remainingTime = 10000 - timeAlreadySpent;
      
      if (remainingTime > 0) {
        readTimerRef.current = setTimeout(async () => {
          if (currentArticleIdRef.current === currentArticle.article_id && 
              !hasMarkedAsReadRef.current.has(currentArticle.article_id)) {
            try {
              await markAsRead(currentArticle.article_id).unwrap();
              hasMarkedAsReadRef.current.add(currentArticle.article_id);
            } catch (error) {
              console.error('Failed to auto-mark article as read:', error);
            }
          }
        }, remainingTime);
      }
    }
  }, [currentArticle, markAsRead]);

  // Return all the necessary data and functions
  return {
    // Current state
    currentArticle,
    currentIndex,
    allArticles,
    hasMoreArticles,
    totalArticles: allArticles.length,
    
    // Loading states
    isInitialLoading,
    isLoadingMore,
    isMarkingAsRead,
    isTogglingLike,
    isNavigating: newsState.isNavigating,
    
    // Error states
    error: initialError || loadMoreError,
    
    // Navigation functions
    goToNext,
    goToPrevious,
    goToIndex,
    canGoNext: currentIndex < allArticles.length - 1,
    canGoPrevious: currentIndex > 0,
    
    // Article actions
    markArticleAsRead,
    toggleArticleLike,
    
    // Auto-read timer controls
    pauseReadTimer,
    resumeReadTimer,
    
    // Utility functions
    setupKeyboardNavigation,
    refreshArticles,
    
    // Progress info
    progress: allArticles.length > 0 ? ((currentIndex + 1) / allArticles.length) * 100 : 0,
  };
};