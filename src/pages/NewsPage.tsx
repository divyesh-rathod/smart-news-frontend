// src/pages/NewsPage.tsx
import React from 'react';
import ArticleViewer from '../components/ArticleViewer/ArticleViewer';
import { useNews } from '../hooks/useNews';
import './News.css';

const NewsPage: React.FC = () => {
  const news = useNews();

  return (
    <div className="news-page-container">
      <header className="news-page-header">
        <h1>Smart News</h1>
        <p>Discover personalized articles curated just for you</p>
        
        <button 
          className="refresh-btn"
          onClick={news.refreshArticles}
          disabled={news.isLoadingMore}
        >
          🔄 Refresh Articles
        </button>
      </header>

      <main className="news-page-content">
        <ArticleViewer
          news={news}
          showLikeButton={true}
          autoMarkAsRead={true}
        />
      </main>

      {/* Loading indicator when fetching more */}
      {news.isLoadingMore && (
        <div className="loading-more">
          <div className="small-spinner"></div>
          <span>Loading more articles...</span>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
