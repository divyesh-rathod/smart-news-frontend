// src/pages/NewsRedux.tsx
import React from 'react';
import ArticleViewer from '../components/ArticleViewer/ArticleViewer';
import { useNews } from '../hooks/useNews';
import './News.css';

const NewsPage: React.FC = () => {
  const {
    currentArticle,
    currentIndex,
    totalArticles,
    isLoadingMore,
    refreshArticles,
  } = useNews();

  // Handle article change (for analytics, logging, etc.)
  const handleArticleChange = (articleId: string, index: number) => {
    console.log(`Viewing article ${index + 1}/${totalArticles}:`, articleId);
    
    // Optional: Send analytics event
    // analytics.track('article_viewed', { 
    //   article_id: articleId, 
    //   position: index 
    // });
  };

  return (
    <div className="news-page-container">
      <header className="news-page-header">
        <h1>Smart News</h1>
        <p>Discover personalized articles curated just for you</p>
        
        {/* Optional: Refresh button */}
        <button 
          className="refresh-btn"
          onClick={refreshArticles}
          disabled={isLoadingMore}
        >
          🔄 Refresh Articles
        </button>
      </header>

      <main className="news-page-content">
        <ArticleViewer
          onArticleChange={handleArticleChange}
          showLikeButton={true}
          autoMarkAsRead={false}
        />
      </main>

      {/* Loading indicator when fetching more */}
      {isLoadingMore && (
        <div className="loading-more">
          <div className="small-spinner"></div>
          <span>Loading more articles...</span>
        </div>
      )}

      {/* Optional: Article info panel */}
      {currentArticle && (
        <div className="article-info-panel">
          <p>
            Reading article {currentIndex + 1} of {totalArticles} • 
            Published {new Date(currentArticle.pub_date).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default NewsPage;