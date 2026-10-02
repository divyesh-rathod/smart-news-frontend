// src/hooks/useNews.ts
import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  useGetUnseenArticlesQuery,
  useLazyGetUnseenArticlesQuery,
  useMarkArticleAsReadMutation,
} from '../store/api/newsApi';
import { toggleArticleLike } from '../store/likeArticle';
import {
  appendArticles,
  dismissLikeError,
  navigateNext,
  navigatePrevious,
  selectAllArticles,
  selectCurrentArticle,
  selectCurrentIndex,
  selectIsLikePending,
  selectIsNavigating,
  selectLikeError,
  selectLikedArticleIds,
  selectNextCursor,
  setAllArticles,
  setCurrentIndex,
  setIsNavigating,
  setNextCursor,
} from '../store/slices/newsSlice';

const MARK_AS_READ_AFTER_MS = 10_000;

export const useNews = () => {
  const dispatch = useAppDispatch();

  // ========================================================================
  // STATE
  // ========================================================================
  const currentArticle = useAppSelector(selectCurrentArticle);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const allArticles = useAppSelector(selectAllArticles);
  const nextCursor = useAppSelector(selectNextCursor);
  const isNavigating = useAppSelector(selectIsNavigating);
  const likedArticleIds = useAppSelector(selectLikedArticleIds);
  const isLikePending = useAppSelector(selectIsLikePending(currentArticle?.article_id));
  const likeError = useAppSelector(selectLikeError);

  const {
    data: initialArticlesData,
    isLoading: isInitialLoading,
    error: initialError,
  } = useGetUnseenArticlesQuery({ limit: 20 });

  const [fetchMoreArticles, { isLoading: isLoadingMore, error: loadMoreError }] = useLazyGetUnseenArticlesQuery();
  const [markAsRead, { isLoading: isMarkingAsRead }] = useMarkArticleAsReadMutation();

  // ========================================================================
  // AUTO MARK-AS-READ TIMER
  // ========================================================================
  const readTimerRef = useRef<number | null>(null);
  const currentArticleIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasMarkedAsReadRef = useRef<Set<string>>(new Set());

  const startReadTimer = useCallback((articleId: string) => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
    }
    if (hasMarkedAsReadRef.current.has(articleId)) {
      return;
    }

    currentArticleIdRef.current = articleId;
    startTimeRef.current = Date.now();

    readTimerRef.current = setTimeout(async () => {
      if (currentArticleIdRef.current === articleId && !hasMarkedAsReadRef.current.has(articleId)) {
        try {
          await markAsRead(articleId).unwrap();
          hasMarkedAsReadRef.current.add(articleId);
        } catch (error) {
          console.error('Failed to mark article as read:', error);
        }
      }
    }, MARK_AS_READ_AFTER_MS);
  }, [markAsRead]);

  const stopReadTimer = useCallback((shouldCheckTime: boolean = false) => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
    }

    const articleId = currentArticleIdRef.current;
    if (shouldCheckTime && articleId && startTimeRef.current && !hasMarkedAsReadRef.current.has(articleId)) {
      if (Date.now() - startTimeRef.current >= MARK_AS_READ_AFTER_MS) {
        markAsRead(articleId)
          .unwrap()
          .then(() => hasMarkedAsReadRef.current.add(articleId))
          .catch((error) => console.error('Failed to mark article as read:', error));
      }
    }

    currentArticleIdRef.current = null;
    startTimeRef.current = null;
  }, [markAsRead]);

  // ========================================================================
  // INITIALIZATION
  // ========================================================================
  useEffect(() => {
    if (initialArticlesData && allArticles.length === 0) {
      dispatch(setAllArticles(initialArticlesData.results));
      dispatch(setNextCursor(initialArticlesData.next_cursor));
    }
  }, [initialArticlesData, allArticles.length, dispatch]);

  useEffect(() => {
    if (currentArticle?.article_id) {
      stopReadTimer(true);
      startReadTimer(currentArticle.article_id);
    }
    return () => {
      stopReadTimer(false);
    };
  }, [currentArticle?.article_id, startReadTimer, stopReadTimer]);

  // ========================================================================
  // NAVIGATION
  // ========================================================================
  const goToNext = useCallback(() => {
    if (isNavigating) return;

    stopReadTimer(true);
    dispatch(setIsNavigating(true));
    setTimeout(() => dispatch(setIsNavigating(false)), 300);
    dispatch(navigateNext());

    // Fetch the next page when the reader is within 3 articles of the end
    if (currentIndex >= allArticles.length - 3 && nextCursor) {
      fetchMoreArticles({ cursor: nextCursor, limit: 20 })
        .unwrap()
        .then((data) => {
          dispatch(appendArticles(data.results));
          dispatch(setNextCursor(data.next_cursor));
        })
        .catch((error) => console.error('Failed to fetch more articles:', error));
    }
  }, [isNavigating, currentIndex, allArticles.length, nextCursor, dispatch, fetchMoreArticles, stopReadTimer]);

  const goToPrevious = useCallback(() => {
    if (isNavigating) return;

    stopReadTimer(true);
    dispatch(setIsNavigating(true));
    setTimeout(() => dispatch(setIsNavigating(false)), 300);
    dispatch(navigatePrevious());
  }, [isNavigating, dispatch, stopReadTimer]);

  // ========================================================================
  // ARTICLE ACTIONS
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
    } catch (error) {
      console.error('Failed to mark article as read:', error);
    }
  }, [currentArticle, markAsRead, stopReadTimer]);

  /** Like or unlike the article on screen (or `articleId`); see toggleArticleLike. */
  const toggleLike = useCallback((articleId?: string) => dispatch(toggleArticleLike(articleId)), [dispatch]);
  const dismissError = useCallback(() => dispatch(dismissLikeError()), [dispatch]);

  const refreshArticles = useCallback(async () => {
    try {
      stopReadTimer(false);
      const data = await fetchMoreArticles({ limit: 20 }).unwrap();
      dispatch(setAllArticles(data.results));
      dispatch(setNextCursor(data.next_cursor));
      dispatch(setCurrentIndex(0));
      hasMarkedAsReadRef.current.clear();
    } catch (error) {
      console.error('Failed to refresh articles:', error);
    }
  }, [fetchMoreArticles, dispatch, stopReadTimer]);

  return {
    currentArticle,
    currentIndex,
    totalArticles: allArticles.length,
    progress: allArticles.length > 0 ? ((currentIndex + 1) / allArticles.length) * 100 : 0,

    isInitialLoading,
    isLoadingMore,
    isMarkingAsRead,
    isNavigating,
    error: initialError || loadMoreError,

    goToNext,
    goToPrevious,
    canGoNext: currentIndex < allArticles.length - 1,
    canGoPrevious: currentIndex > 0,

    markArticleAsRead,
    refreshArticles,

    toggleLike,
    isLiked: currentArticle ? likedArticleIds.includes(currentArticle.article_id) : false,
    isLikePending,
    likeError,
    dismissLikeError: dismissError,
  };
};
