// src/components/ArticleViewer/ArticleViewer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useScrollHeader } from '../../hooks/useScrollHeader';
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
    isNavigating,
    canGoNext,
    canGoPrevious,
    goToNext,
    goToPrevious,
    markArticleAsRead,
    isMarkingAsRead,
    toggleArticleLike,
    getCurrentArticleLikeStatus,
    progress,
    hasPendingRequests,
    // Remove non-existent properties
  } = useNews();
   
  const { getHeaderClasses, isScrolled } = useScrollHeader({
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
  // KEYBOARD NAVIGATION - MANUAL SETUP
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
  }, [canGoNext, canGoPrevious, isNavigating, currentArticle]);

  // ========================================================================
  // LOCAL STATE - SIMPLE
  // ========================================================================
  
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showSimilarArticlesNotification, setShowSimilarArticlesNotification] = useState(false);

  // ========================================================================
  // GET LIKE STATUS
  // ========================================================================
  
  const { isLiked, isLoading: likeLoading } = getCurrentArticleLikeStatus();

  // ========================================================================
  // ARTICLE CHANGE NOTIFICATION - SIMPLE
  // ========================================================================
  
  const lastNotifiedRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (currentArticle && onArticleChange && lastNotifiedRef.current !== currentArticle.article_id) {
      lastNotifiedRef.current = currentArticle.article_id;
      onArticleChange(currentArticle.article_id, currentIndex);
    }
  }, [currentArticle?.article_id, currentIndex, onArticleChange]);

  // ========================================================================
  // 🔧 FIXED - SIMPLE EVENT HANDLERS
  // ========================================================================
  
  const handleLikeClick = async () => {
    if (!currentArticle || likeLoading) return;
    
    setShowLikeAnimation(true);
    
    try {
      // 🔧 FIXED - Use correct function name
      const result = await toggleArticleLike();
      
      if (result && result.liked && result.top5 && result.top5.length > 0) {
        console.log(`🎉 Liked! ${result.top5.length} similar articles incoming...`);
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

  const renderCategories = () => {
    if (!currentArticle?.categories) return null;
    
    let categoryArray: string[] = [];
    
    if (Array.isArray(currentArticle.categories)) {
      categoryArray = currentArticle.categories;
    } else if (typeof currentArticle.categories === 'string') {
      categoryArray = [currentArticle.categories];
    } else if (currentArticle.category_1) {
      categoryArray = [String(currentArticle.category_1)];
    }
    
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

  // 🔧 FIXED - Remove duplicate variable definition
  // const { isLiked: currentlyLiked } = getCurrentArticleLikeStatus(); // Removed this line

  return (
    <div className="article-viewer-container">
      
      {/* 🔧 FIXED - Simple Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          <span>{formatProgress()}</span>
          {hasPendingRequests && (
            <div className="loading-indicator">
              <span>🎯 Similar articles loading...</span>
            </div>
          )}
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

          {/* 🔧 FIXED - Simple Like Section with proper variables */}
          {showLikeButton && (
            <div className="secondary-actions">
              <button
                className={`like-button ${isLiked ? 'liked' : ''} ${likeLoading ? 'loading' : ''} ${showLikeAnimation ? 'animate' : ''}`}
                onClick={handleLikeClick}
                disabled={likeLoading}
                title={isLiked ? 'Unlike article (Space)' : 'Like article (Space)'}
                aria-label={isLiked ? 'Unlike this article' : 'Like this article'}
              >
                {likeLoading ? (
                  <>
                    <div className="button-spinner"></div>
                    <span className="like-text">Processing...</span>
                  </>
                ) : (
                  <>
                    <span className={`like-icon ${isLiked ? 'liked' : ''}`}>
                      {isLiked ? '❤️' : '🤍'}
                    </span>
                    <span className="like-text">
                      {isLiked ? 'Liked!' : 'Like Article'}
                    </span>
                  </>
                )}
              </button>
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

      {/* Similar Articles Notification */}
      {showSimilarArticlesNotification && (
        <div className="similar-articles-notification">
          <span className="notification-icon">🎉</span>
          <span>Great choice! Similar articles are being prepared for you...</span>
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