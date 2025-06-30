// src/components/LikeButton/LikeButton.tsx
import React, { useState, useCallback } from 'react';
import { useAppSelector } from '../../store/hooks';
import { useToggleArticleLikeMutation } from '../../store/api/newsApi';
import { selectIsArticleLiked, selectIsLikeLoading } from '../../store/slices/newsSlice';
import './LikeButton.css';

interface LikeButtonProps {
  articleId: string;
  userCurrentIndex?: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'minimal' | 'pill';
  showCount?: boolean;
  onLikeSuccess?: (result: any) => void;
  onLikeError?: (error: any) => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  articleId,
  userCurrentIndex = 0,
  size = 'medium',
  variant = 'default',
  showCount = true,
  onLikeSuccess,
  onLikeError,
  disabled = false,
  className = '',
  children,
}) => {
  // ========================================================================
  // REDUX STATE & API
  // ========================================================================
  
  const isLiked = useAppSelector(selectIsArticleLiked(articleId));
  const isLoading = useAppSelector(selectIsLikeLoading(articleId));
  const [toggleLikeMutation] = useToggleArticleLikeMutation();

  // ========================================================================
  // LOCAL STATE
  // ========================================================================
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // ========================================================================
  // EVENT HANDLERS
  // ========================================================================
  
  const handleLikeClick = useCallback(async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled || isLoading) return;

    try {
      setIsAnimating(true);
      
      const result = await toggleLikeMutation({
        articleId,
        userCurrentIndex,
      }).unwrap();

      // Show success animation
      if (result.apiResponse.liked) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        
        if (onLikeSuccess) {
          onLikeSuccess(result);
        }
      }

    } catch (error) {
      console.error('❌ Like toggle failed:', error);
      if (onLikeError) {
        onLikeError(error);
      }
    } finally {
      setTimeout(() => setIsAnimating(false), 600);
    }
  }, [
    articleId,
    userCurrentIndex,
    disabled,
    isLoading,
    toggleLikeMutation,
    onLikeSuccess,
    onLikeError,
  ]);

  // ========================================================================
  // DYNAMIC CLASS NAMES
  // ========================================================================
  
  const buttonClasses = [
    'like-button-component',
    `like-button-${size}`,
    `like-button-${variant}`,
    isLiked ? 'liked' : 'not-liked',
    isLoading ? 'loading' : '',
    isAnimating ? 'animating' : '',
    showSuccess ? 'success-animation' : '',
    disabled ? 'disabled' : '',
    className,
  ].filter(Boolean).join(' ');

  // ========================================================================
  // RENDER CONTENT
  // ========================================================================
  
  const renderButtonContent = () => {
    if (children) {
      return children;
    }

    if (isLoading) {
      return (
        <>
          <span className="like-spinner"></span>
          <span className="like-text">
            {variant === 'minimal' ? '' : 'Processing...'}
          </span>
        </>
      );
    }

    const heartIcon = isLiked ? '💙' : '🤍';
    const likeText = isLiked ? 'Liked' : 'Like';
    
    return (
      <>
        <span className="like-icon" role="img" aria-label={likeText}>
          {heartIcon}
        </span>
        {variant !== 'minimal' && (
          <>
            <span className="like-text">{likeText}</span>
            {showCount && isLiked && (
              <span className="like-count">+5 similar</span>
            )}
          </>
        )}
      </>
    );
  };

  // ========================================================================
  // ACCESSIBILITY ATTRIBUTES
  // ========================================================================
  
  const ariaLabel = isLiked 
    ? `Unlike this article. This will remove it from your liked articles.`
    : `Like this article. This will add it to your liked articles and find similar content.`;

  const title = isLiked
    ? 'Click to unlike this article'
    : 'Click to like this article and discover similar content';

  // ========================================================================
  // RENDER COMPONENT
  // ========================================================================
  
  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={handleLikeClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      title={title}
      data-article-id={articleId}
      data-liked={isLiked}
    >
      {renderButtonContent()}
      
      {/* Success animation overlay */}
      {showSuccess && (
        <div className="success-overlay">
          <span className="success-icon">✨</span>
          <span className="success-text">Finding similar articles...</span>
        </div>
      )}
    </button>
  );
};

export default LikeButton;