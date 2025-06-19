// src/components/ArticleViewer/ArticleViewerRedux.tsx
import React, { useEffect } from 'react';
import { useNews } from '../../hooks/useNews';
import './ArticleViewer.css';

interface ArticleViewerProps {
  onArticleChange?: (articleId: string, index: number) => void;
  showLikeButton?: boolean;
  autoMarkAsRead?: boolean;
}

const ArticleViewer: React.FC<ArticleViewerProps> = ({
  onArticleChange,
  showLikeButton = false,
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
    setupKeyboardNavigation,
    progress,
  } = useNews();

  // Setup keyboard navigation
  useEffect(() => {
    const cleanup = setupKeyboardNavigation();
    return cleanup;
  }, [setupKeyboardNavigation]);

  // Notify parent component of article changes
  useEffect(() => {
    if (currentArticle && onArticleChange) {
      onArticleChange(currentArticle.article_id, currentIndex);
    }
  }, [currentArticle, currentIndex, onArticleChange]);

  // Format date function
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

  // Handle like button click
  const handleLikeClick = async () => {
    try {
      const result = await toggleArticleLike();
      if (result) {
        console.log('Like result:', result);
        // You can show recommendations from result.top5 and result.similar
      }
    } catch (error) {
      console.error('Failed to like article:', error);
    }
  };

  // Handle read button click
  const handleMarkAsRead = () => {
    markArticleAsRead();
    if (autoMarkAsRead && canGoNext) {
      setTimeout(() => goToNext(), 500);
    }
  };

  // Loading state
  if (isInitialLoading) {
    return (
      <div className="article-viewer-container">
        <div className="article-loading">
          <div className="loading-spinner"></div>
          <p>Loading articles...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="article-viewer-container">
        <div className="article-empty">
          <h2>Error Loading Articles</h2>
          <p>
            {typeof error === 'object' && 'message' in error 
              ? error.message 
              : 'Failed to load articles. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  // No articles state
  if (!currentArticle) {
    return (
      <div className="article-viewer-container">
        <div className="article-empty">
          <h2>No articles available</h2>
          <p>Check back later for new content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="article-viewer-container">
      {/* Navigation Header */}
      <div className="article-viewer-header">
        <div className="article-counter">
          <span className="current-article">{currentIndex + 1}</span>
          <span className="article-separator">of</span>
          <span className="total-articles">{totalArticles}</span>
        </div>
        
        <div className="article-nav-buttons">
          <button
            className={`nav-button prev-button ${!canGoPrevious ? 'disabled' : ''}`}
            onClick={goToPrevious}
            disabled={!canGoPrevious || isNavigating}
            aria-label="Previous article"
          >
            ←
          </button>
          
          <button
            className={`nav-button next-button ${!canGoNext ? 'disabled' : ''}`}
            onClick={goToNext}
            disabled={!canGoNext || isNavigating}
            aria-label="Next article"
          >
            →
          </button>
        </div>
      </div>

      {/* Article Content */}
      <article className={`article-content ${isNavigating ? 'transitioning' : ''}`}>
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
          </div>
        </header>

        <div className="article-body">
          {currentArticle.description && (
            <div className="article-description">
              <p>{currentArticle.description}</p>
            </div>
          )}
          
          <div className="article-actions">
            <a 
              href={currentArticle.link}
              target="_blank"
              rel="noopener noreferrer"
              className="read-full-article-btn"
            >
              Read Full Article on Guardian
            </a>
            
            {/* Additional action buttons */}
            <div className="article-action-buttons">
              <button
                className="mark-read-btn"
                onClick={handleMarkAsRead}
                disabled={isMarkingAsRead}
              >
                {isMarkingAsRead ? 'Marking...' : 'Mark as Read'}
              </button>
              
              {showLikeButton && (
                <button
                  className="like-btn"
                  onClick={handleLikeClick}
                  disabled={isTogglingLike}
                >
                  {isTogglingLike ? 'Liking...' : '❤️ Like'}
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Progress Indicator */}
      <div className="article-progress">
        <div 
          className="progress-bar"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Keyboard Instructions */}
      <div className="keyboard-hint">
        <p>Use ← → arrow keys to navigate • Press R to mark as read</p>
      </div>
    </div>
  );
};

export default ArticleViewer;