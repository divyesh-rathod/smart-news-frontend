// Simple ArticleViewer.tsx - No Infinite Renders
import React, { useEffect, useState, useRef } from 'react';
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
    canGoNext,
    canGoPrevious,
    error,
    goToNext,
    goToPrevious,
    markArticleAsRead,
    toggleLike,
    getCurrentArticleLikeStatus,
    setupKeyboardNavigation,
    pauseReadTimer,
    resumeReadTimer,
    loadingProgress,
    hasPendingRequests,
  } = useNews();

  // ========================================================================
  // LOCAL STATE - SIMPLE
  // ========================================================================
  
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [showSimilarArticlesNotification, setShowSimilarArticlesNotification] = useState(false);

  // ========================================================================
  // KEYBOARD NAVIGATION - SIMPLE SETUP
  // ========================================================================
  
  useEffect(() => {
    const cleanup = setupKeyboardNavigation();
    return cleanup;
  }, []); // Empty dependency array - setup once

  // ========================================================================
  // PAGE VISIBILITY - SIMPLE
  // ========================================================================
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseReadTimer();
      } else {
        resumeReadTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // Empty dependency array

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
  // SIMPLE EVENT HANDLERS
  // ========================================================================
  
  const handleLikeClick = async () => {
    if (!currentArticle || isTogglingLike) return;
    
    setShowLikeAnimation(true);
    
    try {
      const result = await toggleLike();
      
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
          <p>Something went wrong while loading your news.</p>
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

  const { isLiked: currentlyLiked } = getCurrentArticleLikeStatus();
  const progressValue = loadingProgress();

  return (
    <div className="article-viewer-container">
      
      {/* Simple Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressValue.progress}%` }}
          />
        </div>
        <div className="progress-text">
          <span>Article {currentIndex + 1} of {totalArticles}</span>
          {progressValue.isLoading && (
            <div className="loading-indicator">
              <div className="loading-spinner"></div>
              <span>{progressValue.message}</span>
            </div>
          )}
          {hasPendingRequests && (
            <div className="loading-indicator">
              <span>🎯 Similar articles loading...</span>
            </div>
          )}
        </div>
      </div>

      {/* Simple Navigation Header */}
      <div className="navigation-header">
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
            
        
          </div>

          {/* Simple Like Section */}
          {showLikeButton && (
            <div className="like-section">
              <h3>Enjoying this article?</h3>
              <button
                className={`like-button ${currentlyLiked ? 'liked' : ''} ${showLikeAnimation ? 'animating' : ''}`}
                onClick={handleLikeClick}
                disabled={isTogglingLike}
                title="Like article (F key or Space)"
                style={{
                  background: currentlyLiked 
                    ? 'linear-gradient(135deg, #007bff, #0056b3)' 
                    : 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
                  color: currentlyLiked ? 'white' : '#495057',
                  border: `2px solid ${currentlyLiked ? '#0056b3' : '#dee2e6'}`,
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isTogglingLike ? 'not-allowed' : 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  justifyContent: 'center'
                }}
              >
                {isTogglingLike ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>{currentlyLiked ? '❤️' : '🤍'}</span>
                    <span>{currentlyLiked ? 'Liked!' : 'Like Article'}</span>
                  </>
                )}
              </button>
              <p style={{ marginTop: '12px', fontSize: '14px', color: '#6c757d', textAlign: 'center' }}>
                {currentlyLiked 
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
    </div>
  );
};

export default ArticleViewer;