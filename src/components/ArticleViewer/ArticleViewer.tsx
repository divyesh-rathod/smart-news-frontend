// src/components/ArticleViewer/ArticleViewer.tsx
import React, { useEffect, useState } from 'react';
import { useNews } from '../../hooks/useNews';
import './ArticleViewer.css';

interface ArticleViewerProps {
  onArticleChange?: (articleId: string, index: number) => void;
  showLikeButton?: boolean;
  autoMarkAsRead?: boolean;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({
  onArticleChange,
  showLikeButton = true,
  autoMarkAsRead = false
}) => {
  const {
    currentArticle,
    currentIndex,
    totalArticles,
    isInitialLoading,
    isNavigating,
    isMarkingAsRead,
    isTogglingLike,
    error,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
    markArticleAsRead,
    toggleArticleLike,
    getCurrentArticleLikeStatus,
    setupKeyboardNavigation,
    pauseReadTimer,
    resumeReadTimer,
    progress,
    hasPendingRequests,
    getPendingRequestsInfo,
  } = useNews();

  // ========================================================================
  // LOCAL STATE FOR UI ENHANCEMENTS
  // ========================================================================
  
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showSimilarArticlesNotification, setShowSimilarArticlesNotification] = useState(false);

  // ========================================================================
  // KEYBOARD NAVIGATION SETUP
  // ========================================================================
  
  useEffect(() => {
    const cleanup = setupKeyboardNavigation();
    return cleanup;
  }, [setupKeyboardNavigation]);

  // ========================================================================
  // PAGE VISIBILITY HANDLING (Pause/Resume timer)
  // ========================================================================
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseReadTimer();
        console.log('🔄 Tab hidden - pausing read timer');
      } else {
        resumeReadTimer();
        console.log('✅ Tab visible - resuming read timer');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pauseReadTimer, resumeReadTimer]);

  // ========================================================================
  // ARTICLE CHANGE NOTIFICATION
  // ========================================================================
  
  useEffect(() => {
    if (currentArticle && onArticleChange) {
      onArticleChange(currentArticle.article_id, currentIndex);
    }
  }, [currentArticle, currentIndex, onArticleChange]);

  // ========================================================================
  // SIMILAR ARTICLES NOTIFICATION
  // ========================================================================
  
  useEffect(() => {
    if (hasPendingRequests) {
      const pendingInfo = getPendingRequestsInfo();
      console.log(`🎯 ${pendingInfo.count} similar article requests pending...`);
      
      setShowSimilarArticlesNotification(true);
      setTimeout(() => setShowSimilarArticlesNotification(false), 5000);
    }
  }, [hasPendingRequests, getPendingRequestsInfo]);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  const handleLikeClick = async () => {
    if (!currentArticle) return;
    
    try {
      setShowLikeAnimation(true);
      
      const result = await toggleArticleLike();
      
      if (result?.liked && result?.top5?.length > 0) {
        console.log(`🎉 Liked! ${result.top5.length} similar articles incoming...`);
        
        // Show notification that similar articles are being processed
        setShowSimilarArticlesNotification(true);
        setTimeout(() => setShowSimilarArticlesNotification(false), 4000);
      }
      
    } catch (error) {
      console.error('❌ Like failed:', error);
    } finally {
      setTimeout(() => setShowLikeAnimation(false), 500);
    }
  };

  const handleMarkAsRead = () => {
    if (!currentArticle) return;
    
    markArticleAsRead();
    if (autoMarkAsRead && canGoNext) {
      setTimeout(() => goToNext(), 500);
    }
  };

  const handleNextClick = () => {
    goToNext();
  };

  const handlePreviousClick = () => {
    goToPrevious();
  };

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatProgress = () => {
    return `${currentIndex + 1} of ${totalArticles}`;
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================
  
  if (isInitialLoading) {
    return (
      <div className="article-viewer-container">
        <div className="article-loading">
          <div className="loading-spinner"></div>
          <p>Loading your personalized news...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================
  
  if (error) {
    return (
      <div className="article-viewer-container">
        <div className="article-error">
          <h2>Unable to Load Articles</h2>
          <p>
            {typeof error === 'object' && 'message' in error 
              ? error.message 
              : 'Something went wrong while loading your news.'}
          </p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // NO ARTICLES STATE
  // ========================================================================
  
  if (!currentArticle) {
    return (
      <div className="article-viewer-container">
        <div className="article-empty">
          <h2>No More Articles</h2>
          <p>You're all caught up! Check back later for more news.</p>
          <button 
            className="refresh-button"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // GET CURRENT ARTICLE LIKE STATUS
  // ========================================================================
  
  const { isLiked, isLoading: likeLoading } = getCurrentArticleLikeStatus();

  // ========================================================================
  // MAIN RENDER
  // ========================================================================
  
  return (
    <div className="article-viewer-container">
      
      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="progress-text">{formatProgress()}</div>
      </div>

      {/* Similar Articles Notification */}
      {showSimilarArticlesNotification && (
        <div className="similar-articles-notification">
          <span className="notification-icon">🎯</span>
          <span>Finding similar articles you might like...</span>
          <div className="notification-spinner"></div>
        </div>
      )}

      {/* Navigation Header */}
      <div className="navigation-header">
        <div className="nav-controls">
          <button
            className={`nav-button prev-button ${!canGoPrevious ? 'disabled' : ''}`}
            onClick={handlePreviousClick}
            disabled={!canGoPrevious || isNavigating}
            aria-label="Previous article"
            title="Previous article (Left arrow or H)"
          >
            ← Previous
          </button>
          
          <div className="article-counter">
            <span className="current-number">{currentIndex + 1}</span>
            <span className="separator">/</span>
            <span className="total-number">{totalArticles}</span>
          </div>
          
          <button
            className={`nav-button next-button ${!canGoNext ? 'disabled' : ''}`}
            onClick={handleNextClick}
            disabled={!canGoNext || isNavigating}
            aria-label="Next article"
            title="Next article (Right arrow or L)"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Article Content */}
      <article className={`article-content ${isNavigating ? 'transitioning' : ''}`}>
        
        {/* Article Header */}
        <header className="article-header">
          <h1 className="article-title">
            <a 
              href={currentArticle.link}
              target="_blank"
              rel="noopener noreferrer"
              className="article-title-link"
            >
              {currentArticle.title}
            </a>
          </h1>
          
          <div className="article-meta">
            <time className="article-date" dateTime={currentArticle.pub_date}>
              {formatDate(currentArticle.pub_date)}
            </time>
            
            {currentArticle.categories && currentArticle.categories.length > 0 && (
              <div className="article-categories">
                {currentArticle.categories.slice(0, 4).map((category, index) => (
                  <span key={index} className="category-tag">
                    {category}
                  </span>
                ))}
              </div>
            )}

            {/* Similar Article Badge */}
            {currentArticle.isSimilar && (
              <div className="similar-badge">
                <span className="similar-icon">💡</span>
                <span>Recommended for you</span>
              </div>
            )}
          </div>
        </header>

        {/* Article Body */}
        <div className="article-body">
          {currentArticle.description && (
            <div className="article-description">
              <p>{currentArticle.description}</p>
            </div>
          )}
          
          {currentArticle.category_2 && (
            <div className="article-summary">
              <p>{currentArticle.category_2}</p>
            </div>
          )}
        </div>

        {/* Article Actions */}
        <div className="article-actions">
          <div className="primary-actions">
            <a 
              href={currentArticle.link}
              target="_blank"
              rel="noopener noreferrer"
              className="read-full-article-btn"
            >
              Read Full Article
            </a>
            
            <button
              className="mark-read-btn"
              onClick={handleMarkAsRead}
              disabled={isMarkingAsRead}
              title="Mark as read (R key)"
            >
              {isMarkingAsRead ? (
                <>
                  <span className="button-spinner"></span>
                  Marking...
                </>
              ) : (
                <>
                  <span className="read-icon">✓</span>
                  Mark as Read
                </>
              )}
            </button>
          </div>
          
          {/* Like Button */}
          {showLikeButton && (
            <div className="secondary-actions">
              <button
                className={`like-button ${isLiked ? 'liked' : ''} ${showLikeAnimation ? 'animate' : ''}`}
                onClick={handleLikeClick}
                disabled={likeLoading || isTogglingLike}
                title={isLiked ? 'Unlike this article (F key)' : 'Like this article (F key)'}
              >
                {likeLoading || isTogglingLike ? (
                  <>
                    <span className="button-spinner"></span>
                    <span className="like-text">Processing...</span>
                  </>
                ) : (
                  <>
                    <span className={`like-icon ${isLiked ? 'liked' : ''}`}>
                      {isLiked ? '💙' : '🤍'}
                    </span>
                    <span className="like-text">
                      {isLiked ? 'Liked' : 'Like'}
                    </span>
                    {isLiked && (
                      <span className="like-count">+5 similar</span>
                    )}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </article>

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts">
        <small>
          <strong>Shortcuts:</strong> 
          ← / H: Previous | → / L: Next | R: Mark Read | F: Like | Space: Like
        </small>
      </div>
    </div>
  );
};

export default ArticleViewer;