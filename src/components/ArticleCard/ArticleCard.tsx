// src/components/ArticleCard/ArticleCard.tsx
import React from 'react';
import { type Article } from '../../types/articleTypes';
import './ArticleCard.css';

interface ArticleCardProps {
  article: Article;
  onRead?: (articleId: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onRead }) => {
  const handleTitleClick = () => {
    if (onRead) {
      onRead(article.article_id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <article className="article-card">
      <div className="article-card-header">
        <h2 className="article-card-title">
          <a 
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleTitleClick}
            className="article-title-link"
          >
            {article.title}
          </a>
        </h2>
        <time className="article-card-date" dateTime={article.pub_date}>
          {formatDate(article.pub_date)}
        </time>
      </div>

      {article.description && (
        <div className="article-card-body">
          <p className="article-card-description">
            {truncateText(article.description)}
          </p>
        </div>
      )}

      <div className="article-card-footer">
        {article.categories && article.categories.length > 0 && (
          <div className="article-card-categories">
            {article.categories.slice(0, 3).map((category, index) => (
              <span key={index} className="article-category-tag">
                {category}
              </span>
            ))}
          </div>
        )}
        
        <div className="article-card-actions">
          <a 
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="article-read-more"
            onClick={handleTitleClick}
          >
            Read Full Article
          </a>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;