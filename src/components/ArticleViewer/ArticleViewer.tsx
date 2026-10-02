// src/components/ArticleViewer/ArticleViewer.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useScrollHeader } from '../../hooks/useScrollHeader';
import type { NewsController } from '../../hooks/useNews';
import './ArticleViewer.css';

interface ArticleViewerProps {
  news: NewsController;
  showLikeButton?: boolean;
  autoMarkAsRead?: boolean;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({
  news,
  showLikeButton = true,
  autoMarkAsRead = false
}) => {
  const {
    currentArticle,
    currentIndex,
    totalArticles,
    isNavigating,
    canGoNext,
    canGoPrevious,
    goToNext,
    goToPrevious,
    markArticleAsRead,
    isMarkingAsRead,
    toggleLike,
    isLiked,
    isLikePending,
    likeError,
    dismissLikeError,
    progress,
  } = news;
   
  const { getHeaderClasses } = useScrollHeader({
    threshold: 80,
    debounceMs: 10,
    hideOnDownScroll: true
  });

  // ========================================================================
  // LOCAL UTILITY FUNCTIONS
  // ========================================================================
  
  const formatProgress = () => {
    if (totalArticles === 0) return 'No articles';
    return `Article ${currentIndex + 1} of ${totalArticles}`;
  };

  // ========================================================================
  // LOCAL STATE
  // ========================================================================
  
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [recommendationsAdded, setRecommendationsAdded] = useState(0);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  const handleLikeClick = useCallback(async () => {
    setShowLikeAnimation(true);
    setTimeout(() => setShowLikeAnimation(false), 500);

    const outcome = await toggleLike();
    if (outcome && outcome.recommendationsAdded > 0) {
      setRecommendationsAdded(outcome.recommendationsAdded);
      setTimeout(() => setRecommendationsAdded(0), 4000);
    }
  }, [toggleLike]);

  const handleMarkAsRead = useCallback(() => {
    if (!currentArticle) return;
    
    markArticleAsRead();
    if (autoMarkAsRead && canGoNext) {
      setTimeout(() => goToNext(), 500);
    }
  }, [currentArticle, markArticleAsRead, autoMarkAsRead, canGoNext, goToNext]);

  // ========================================================================
  // KEYBOARD NAVIGATION
  // ========================================================================
  
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'arrowleft':
        case 'h':
          event.preventDefault();
          if (canGoPrevious && !isNavigating) goToPrevious();
          break;
        case 'arrowright':
        case 'l':
          event.preventDefault();
          if (canGoNext && !isNavigating) goToNext();
          break;
        case ' ': // Space bar
        case 'f':
          event.preventDefault();
          handleLikeClick();
          break;
        case 'r':
          event.preventDefault();
          handleMarkAsRead();
          break;
        case 'enter':
          event.preventDefault();
          if (currentArticle) {
            window.open(currentArticle.link, '_blank');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [canGoNext, canGoPrevious, isNavigating, currentArticle, goToNext, goToPrevious, handleLikeClick, handleMarkAsRead]);

  // ========================================================================
  // UTILITY FUNCTIONS
  // ========================================================================
  
  const renderCategories = () => {
    const categoryArray = currentArticle?.categories ?? [];
    
    return categoryArray.length > 0 && (
      <div className="article-categories">
        {categoryArray.slice(0, 4).map((category, index) => (
          <span key={index} className="category-tag">
            {category}
          </span>
        ))}
      </div>
    );
  };

  // ========================================================================
  // LOADING STATE (Simplified)
  // ========================================================================
  
  if (!currentArticle && totalArticles === 0) {
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
  // NO ARTICLES STATE
  // ========================================================================
  
  if (!currentArticle) {
    return (
      <div className="article-viewer-container">
        <div className="article-empty">
          <h2>No More Articles</h2>
          <p>You're all caught up! Check back later for fresh content.</p>
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

  return (
    <div className="article-viewer-container">
      
      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          <span>{formatProgress()}</span>
        </div>
      </div>

      {/* Navigation Header */}
      <div className={getHeaderClasses()}>
        <div className="nav-controls">
          <button
            className={`nav-button ${!canGoPrevious ? 'disabled' : ''}`}
            onClick={goToPrevious}
            disabled={!canGoPrevious || isNavigating}
            title="Previous article (Left arrow or H)"
          >
            ← Previous
          </button>
          
          <div className="article-counter">
            <span className="current-number">{currentIndex + 1}</span>
            <span className="separator">of</span>
            <span className="total-number">{totalArticles}</span>
          </div>
          
          <button
            className={`nav-button ${!canGoNext ? 'disabled' : ''}`}
            onClick={goToNext}
            disabled={!canGoNext || isNavigating}
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
            {renderCategories()}

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
          {currentArticle.category_2 && (
            <div className="article-description">
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
                  <div className="button-spinner"></div>
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

          {/* Like: shows the new state at once; busy (and ignoring presses) until the server answers */}
          {showLikeButton && (
            <div className="secondary-actions">
              <button
                className={`like-button ${isLiked ? 'liked' : ''} ${isLikePending ? 'loading' : ''} ${showLikeAnimation ? 'animate' : ''}`}
                onClick={handleLikeClick}
                disabled={isLikePending}
                aria-busy={isLikePending}
                title={isLiked ? 'Unlike article (Space)' : 'Like article (Space)'}
                aria-label={isLiked ? 'Unlike this article' : 'Like this article'}
              >
                <span className={`like-icon ${isLiked ? 'liked' : ''}`}>
                  {isLiked ? '❤️' : '🤍'}
                </span>
                <span className="like-text">
                  {isLiked ? 'Liked!' : 'Like Article'}
                </span>
              </button>
              {likeError && (
                <div role="alert" className="like-error">
                  <span>{likeError}</span>
                  <button type="button" onClick={dismissLikeError} aria-label="Dismiss">×</button>
                </div>
              )}
              <p style={{ marginTop: '12px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
                {isLiked 
                  ? 'Thanks! We\'ll find similar articles for you.' 
                  : 'Help us learn your preferences and discover similar content.'
                }
              </p>
            </div>
          )}
        </div>
      </article>

      {/* Recommendations from the last like */}
      {recommendationsAdded > 0 && (
        <div className="similar-articles-notification" role="status">
          <span className="notification-icon">🎉</span>
          <span>
            Added {recommendationsAdded} similar {recommendationsAdded === 1 ? 'article' : 'articles'} up next
          </span>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="keyboard-shortcuts">
        <strong>Keyboard Shortcuts:</strong> 
        ← → or H L (Navigate) • Space (Like) • R (Mark Read) • Enter (Open Article)
      </div>
    </div>
  );
};

export default ArticleViewer;