// Complete Solution - useNews.ts with Immutable Similar Articles
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
  selectLikedArticleIds,
} from '../store/slices/newsSlice';
import type { ToggleLikeResponse, EnhancedArticle } from '../types/articleTypes';

// 🎯 Similar Article Queue Item Type
interface SimilarArticleRequest {
  sourceArticleId: string;
  similarArticles: EnhancedArticle[];
  requestTime: number;
  insertAfterIndex: number;
}

export const useNews = () => {
  const dispatch = useAppDispatch();
  
  // ========================================================================
  // REDUX SELECTORS - Keep Simple & Working
  // ========================================================================
  const newsState = useAppSelector(selectNews);
  const currentArticle = useAppSelector(selectCurrentArticle);
  const currentIndex = useAppSelector(selectCurrentIndex);
  const allArticles = useAppSelector(selectAllArticles);
  const hasMoreArticles = useAppSelector(selectHasMoreArticles);
  const nextCursor = useAppSelector(selectNextCursor);
  const likedArticleIds = useAppSelector(selectLikedArticleIds);
  
  // ========================================================================
  // API HOOKS - Keep Working Version
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
  // REFS - Keep Working + Add Similar Articles Queue
  // ========================================================================
  const readTimerRef = useRef<number | null>(null);
  const currentArticleIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasMarkedAsReadRef = useRef<Set<string>>(new Set());
  
  // 🆕 Similar Articles Queue - Using Array for Immutability
  const similarArticlesQueue = useRef<SimilarArticleRequest[]>([]);

  // ========================================================================
  // 🔧 IMMUTABLE SIMILAR ARTICLES INSERTION
  // ========================================================================
  const insertSimilarArticlesImmutably = useCallback((request: SimilarArticleRequest) => {
    const { sourceArticleId, similarArticles, insertAfterIndex } = request;
    
    console.log(`🎯 Inserting ${similarArticles.length} similar articles after index ${insertAfterIndex} (source: ${sourceArticleId})`);
    
    // 🔧 IMMUTABLE WAY: Create new articles with proper like status
    const enhancedSimilarArticles: EnhancedArticle[] = similarArticles.map(article => ({
      ...article, // Spread the original article
      isSimilar: true, // Mark as similar
      sourceArticleId: sourceArticleId, // Track source
      isLiked: likedArticleIds.includes(article.article_id), // Sync like status
      isLikeLoading: false // Not loading
    }));
    
    // 🔧 IMMUTABLE WAY: Create new articles array (don't mutate existing)
    const newAllArticles: EnhancedArticle[] = [
      ...allArticles.slice(0, insertAfterIndex + 1), // Articles before and including insert point
      ...enhancedSimilarArticles, // Similar articles
      ...allArticles.slice(insertAfterIndex + 1) // Articles after insert point
    ];
    
    // 🔧 IMMUTABLE WAY: Use Redux dispatch to set new state
    dispatch(setAllArticles(newAllArticles));
    
    console.log(`✅ Inserted ${similarArticles.length} similar articles. Total articles: ${allArticles.length} → ${newAllArticles.length}`);
  }, [allArticles, likedArticleIds, dispatch]);

  // ========================================================================
  // 🔧 QUEUE PROCESSING - Process Multiple Requests Safely
  // ========================================================================
  const processSimilarArticlesQueue = useCallback(() => {
    if (similarArticlesQueue.current.length === 0) return;
    
    console.log(`🔄 Processing ${similarArticlesQueue.current.length} queued similar article requests`);
    
    // Sort by request time (oldest first) to maintain order
    const sortedQueue = [...similarArticlesQueue.current].sort((a, b) => a.requestTime - b.requestTime);
    
    // Process each request
    let indexOffset = 0; // Track how many articles we've added
    
    sortedQueue.forEach((request, queueIndex) => {
      // Adjust insertion index based on previously inserted articles
      const adjustedInsertIndex = request.insertAfterIndex + indexOffset;
      
      const adjustedRequest: SimilarArticleRequest = {
        ...request,
        insertAfterIndex: adjustedInsertIndex
      };
      
      insertSimilarArticlesImmutably(adjustedRequest);
      
      // Update offset for next insertions
      indexOffset += request.similarArticles.length;
      
      console.log(`📝 Processed queue item ${queueIndex + 1}/${sortedQueue.length} (offset: ${indexOffset})`);
    });
    
    // Clear the queue
    similarArticlesQueue.current = [];
    console.log('✅ Similar articles queue cleared');
  }, [insertSimilarArticlesImmutably]);

  // ========================================================================
  // TIMER LOGIC - Keep Working Version
  // ========================================================================
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
          console.log(`⏰ Auto-marking article ${articleId} as read after 10 seconds`);
          await markAsRead(articleId).unwrap();
          hasMarkedAsReadRef.current.add(articleId);
        } catch (error) {
          console.error('❌ Failed to auto-mark article as read:', error);
        }
      }
    }, 10000);

  }, [markAsRead]);

  const stopReadTimer = useCallback((shouldCheckTime: boolean = false) => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
    }

    if (shouldCheckTime && 
        currentArticleIdRef.current && 
        startTimeRef.current && 
        !hasMarkedAsReadRef.current.has(currentArticleIdRef.current)) {
      
      const timeSpent = Date.now() - startTimeRef.current;
      
      if (timeSpent >= 10000) {
        const articleId = currentArticleIdRef.current;
        markAsRead(articleId)
          .unwrap()
          .then(() => {
            console.log(`⏰ Auto-marked article ${articleId} as read (spent ${Math.round(timeSpent/1000)}s)`);
            hasMarkedAsReadRef.current.add(articleId);
          })
          .catch((error) => {
            console.error('❌ Failed to auto-mark article as read on navigation:', error);
          });
      }
    }

    currentArticleIdRef.current = null;
    startTimeRef.current = null;
  }, [markAsRead]);

  // ========================================================================
  // INITIALIZATION - Keep Working Version
  // ========================================================================
  useEffect(() => {
    if (initialArticlesData && allArticles.length === 0) {
      console.log('📥 Loading initial articles:', initialArticlesData.results.length);
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

  useEffect(() => {
    return () => {
      if (readTimerRef.current) {
        clearTimeout(readTimerRef.current);
      }
    };
  }, []);

  // ========================================================================
  // NAVIGATION - Keep Working Logic + Add Smart Queue Processing
  // ========================================================================
  const goToNext = useCallback(() => {
    if (newsState.isNavigating) return;
    
    stopReadTimer(true);
    
    dispatch(setIsNavigating(true));
    setTimeout(() => dispatch(setIsNavigating(false)), 300);
    
    // 🔧 PROCESS QUEUE BEFORE NAVIGATION (perfect timing!)
    if (similarArticlesQueue.current.length > 0) {
      console.log('🎯 Perfect timing! Processing similar articles queue before navigation');
      processSimilarArticlesQueue();
    }
    
    dispatch(navigateNext());
    
    // 🎯 KEEP THE WORKING AUTO-FETCH LOGIC
    if (currentIndex >= allArticles.length - 3 && hasMoreArticles && nextCursor) {
      console.log(`📦 Auto-loading more articles (${allArticles.length - currentIndex - 1} remaining)`);
      fetchMoreArticles({ cursor: nextCursor, limit: 20 })
        .unwrap()
        .then((data) => {
          console.log('📥 Loading more articles:', data.results.length);
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
    processSimilarArticlesQueue,
  ]);

  const goToPrevious = useCallback(() => {
    if (newsState.isNavigating) return;
    
    stopReadTimer(true);
    
    dispatch(setIsNavigating(true));
    setTimeout(() => dispatch(setIsNavigating(false)), 300);
    
    // Also process queue on backward navigation
    if (similarArticlesQueue.current.length > 0) {
      console.log('🎯 Processing similar articles queue before backward navigation');
      processSimilarArticlesQueue();
    }
    
    dispatch(navigatePrevious());
  }, [newsState.isNavigating, dispatch, stopReadTimer, processSimilarArticlesQueue]);

  const goToArticle = useCallback((index: number) => {
    if (index >= 0 && index < allArticles.length) {
      stopReadTimer(true);
      dispatch(setCurrentIndex(index));
    }
  }, [allArticles.length, dispatch, stopReadTimer]);

  // ========================================================================
  // ARTICLE ACTIONS - Keep Working + Enhanced Like with Queueing
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

  // 🔥 ENHANCED LIKE - With Immutable Similar Articles Queueing
  const toggleLike = useCallback(async (articleId?: string): Promise<ToggleLikeResponse | null> => {
    const targetArticleId = articleId || currentArticle?.article_id;
    if (!targetArticleId) {
      console.warn('⚠️ No article ID provided for like toggle');
      return null;
    }
    
    const currentlyLiked = likedArticleIds.includes(targetArticleId);
    console.log(`${!currentlyLiked ? '❤️' : '💔'} Toggling like for ${targetArticleId}: ${currentlyLiked} → ${!currentlyLiked}`);
    
    try {
      const result = await toggleLikeMutation({ 
        articleId: targetArticleId, 
        userCurrentIndex: currentIndex 
      }).unwrap();
      
      console.log('✅ Like toggle successful:', result.apiResponse);
      
      // 🆕 HANDLE SIMILAR ARTICLES - Add to Queue for Immutable Processing
      if (result.apiResponse.liked && result.similarArticlesResult?.similarArticles) {
        const similarArticles = result.similarArticlesResult.similarArticles;
        console.log(`🎯 Got ${similarArticles.length} similar articles for liked article ${targetArticleId}`);
        
        // 🔧 ADD TO QUEUE - Will be processed on next navigation
        const queueRequest: SimilarArticleRequest = {
          sourceArticleId: targetArticleId,
          similarArticles: similarArticles,
          requestTime: Date.now(),
          insertAfterIndex: currentIndex // Insert after current position
        };
        
        similarArticlesQueue.current.push(queueRequest);
        console.log(`📝 Queued ${similarArticles.length} similar articles. Queue size: ${similarArticlesQueue.current.length}`);
        
        // 🎯 OPTION: Auto-process queue immediately (for instant gratification)
        // Uncomment this if you want immediate insertion:
        // processSimilarArticlesQueue();
      }
      
      return result.apiResponse;
      
    } catch (error) {
      console.error('❌ Like toggle failed:', error);
      throw error;
    }
  }, [currentArticle, likedArticleIds, currentIndex, toggleLikeMutation]);

  // ========================================================================
  // UTILITIES - Keep Working + Add Queue Management
  // ========================================================================
  const setupKeyboardNavigation = useCallback(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (event.key === 'ArrowLeft' || event.key === 'h') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowRight' || event.key === 'l') {
        event.preventDefault();
        goToNext();
      } else if (event.key === 'r' || event.key === 'R') {
        event.preventDefault();
        markArticleAsRead();
      } else if (event.key === 'f' || event.key === ' ') {
        event.preventDefault();
        toggleLike();
      }
    };

    console.log('⌨️ Setting up keyboard navigation');
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      console.log('⌨️ Cleaning up keyboard navigation');  
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [goToNext, goToPrevious, markArticleAsRead, toggleLike]);

  const refreshArticles = useCallback(async () => {
    try {
      stopReadTimer(false);
      
      const data = await fetchMoreArticles({ limit: 20 }).unwrap();
      dispatch(setAllArticles(data.results));
      dispatch(setNextCursor(data.next_cursor));
      dispatch(setCurrentIndex(0));
      
      hasMarkedAsReadRef.current.clear();
      similarArticlesQueue.current = []; // Clear queue on refresh
    } catch (error) {
      console.error('❌ Failed to refresh articles:', error);
    }
  }, [fetchMoreArticles, dispatch, stopReadTimer]);

  const pauseReadTimer = useCallback(() => {
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current);
      readTimerRef.current = null;
    }
    console.log('⏸️ Pause read timer');
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
    console.log('▶️ Resume read timer');
  }, [currentArticle, markAsRead]);

  // ========================================================================
  // LIKE & SIMILAR ARTICLES UTILITIES
  // ========================================================================
  const isArticleLiked = useCallback((articleId: string) => {
    return likedArticleIds.includes(articleId);
  }, [likedArticleIds]);

  const getCurrentArticleLikeStatus = useCallback(() => {
    if (!currentArticle) return { isLiked: false, isLoading: false };
    return {
      isLiked: likedArticleIds.includes(currentArticle.article_id),
      isLoading: isTogglingLike,
    };
  }, [currentArticle, likedArticleIds, isTogglingLike]);

  // 🆕 QUEUE STATUS
  const getSimilarArticlesQueueInfo = useCallback(() => {
    return {
      count: similarArticlesQueue.current.length,
      totalSimilarArticles: similarArticlesQueue.current.reduce((sum, req) => sum + req.similarArticles.length, 0),
      requests: similarArticlesQueue.current.map(req => ({
        sourceArticleId: req.sourceArticleId,
        count: req.similarArticles.length,
        age: Date.now() - req.requestTime
      }))
    };
  }, []);

  // 🆕 MANUAL QUEUE PROCESSING (for testing/debugging)
  const processQueueManually = useCallback(() => {
    console.log('🔧 Manual queue processing triggered');
    processSimilarArticlesQueue();
  }, [processSimilarArticlesQueue]);

  // ========================================================================
  // RETURN COMPLETE INTERFACE
  // ========================================================================
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
    goToArticle,
    canGoNext: currentIndex < allArticles.length - 1,
    canGoPrevious: currentIndex > 0,
    
    // Article actions
    markArticleAsRead,
    toggleLike,
    toggleArticleLike: toggleLike,
    
    // Like functionality
    likedArticleIds,
    isArticleLiked,
    getCurrentArticleLikeStatus,
    
    // Auto-read timer controls
    pauseReadTimer,
    resumeReadTimer,
    
    // Utility functions
    setupKeyboardNavigation,
    refreshArticles,
    
    // 🆕 Similar articles queue management
    hasPendingRequests: similarArticlesQueue.current.length > 0,
    getPendingRequestsInfo: getSimilarArticlesQueueInfo,
    processPendingInsertions: processQueueManually,
    clearPendingRequests: () => { similarArticlesQueue.current = []; },
    
    // Progress info
    progress: allArticles.length > 0 ? ((currentIndex + 1) / allArticles.length) * 100 : 0,
    
    // Compatibility
    loadingProgress: () => ({
      isLoading: isLoadingMore,
      message: isLoadingMore ? 'Loading more articles...' : '',
      progress: allArticles.length > 0 ? ((currentIndex + 1) / allArticles.length) * 100 : 0
    }),
    shouldPreload: () => false,
    setIsNavigating: (value: boolean) => dispatch(setIsNavigating(value))
  };
};