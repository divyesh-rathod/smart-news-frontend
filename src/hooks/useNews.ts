// src/hooks/useNews.ts
import { useCallback, useEffect } from 'react';
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

  // Initialize articles on first load
  useEffect(() => {
    if (initialArticlesData && allArticles.length === 0) {
      dispatch(setAllArticles(initialArticlesData.results));
      dispatch(setNextCursor(initialArticlesData.next_cursor));
    }
  }, [initialArticlesData, allArticles.length, dispatch]);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (newsState.isNavigating) return;
    
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
  ]);

  const goToPrevious = useCallback(() => {
    if (newsState.isNavigating) return;
    
    dispatch(setIsNavigating(true));
    setTimeout(() => dispatch(setIsNavigating(false)), 300);
    
    dispatch(navigatePrevious());
  }, [newsState.isNavigating, dispatch]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < allArticles.length) {
      dispatch(setCurrentIndex(index));
    }
  }, [allArticles.length, dispatch]);

  // Article actions
  const markArticleAsRead = useCallback(async (articleId?: string) => {
    const id = articleId || currentArticle?.article_id;
    if (!id) return;
    
    try {
      await markAsRead(id).unwrap();
      
      // Optionally auto-navigate to next article
      if (newsState.autoMarkAsRead && currentIndex < allArticles.length - 1) {
        setTimeout(() => goToNext(), 500);
      }
    } catch (error) {
      console.error('Failed to mark article as read:', error);
    }
  }, [currentArticle, markAsRead, newsState.autoMarkAsRead, currentIndex, allArticles.length, goToNext]);

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
      const data = await fetchMoreArticles({ limit: 20 }).unwrap();
      dispatch(setAllArticles(data.results));
      dispatch(setNextCursor(data.next_cursor));
      dispatch(setCurrentIndex(0));
    } catch (error) {
      console.error('Failed to refresh articles:', error);
    }
  }, [fetchMoreArticles, dispatch]);

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
    
    // Utility functions
    setupKeyboardNavigation,
    refreshArticles,
    
    // Progress info
    progress: allArticles.length > 0 ? ((currentIndex + 1) / allArticles.length) * 100 : 0,
  };
};