// src/types/articleTypes.ts
// ============================================================================
// ORIGINAL API TYPES (UNCHANGED - Direct from Backend)
// ============================================================================

export interface Article {
  article_id: string;
  cleaned_text: string;
  category_1: string[];
  category_2: string | null;
  processed_at: string;
  pub_date: string;
  title: string;
  link: string;
  description: string | null;
  categories: string[] | null;
}

export interface ArticlesResponse {
  results: Article[];
  next_cursor: string | null;
}

export interface ArticleScore {
  article_id: string;
  title: string;
  link: string;
  cleaned_text: string;
  category_1: string[] ;
  category_2: string ;
  score: number;
}

export interface ToggleLikeResponse {
  message: string;
  liked: boolean;
  top5: ArticleScore[];
  similar: ArticleScore[];
}

// ============================================================================
// FRONTEND ENHANCEMENT TYPES (NEW - For Like Feature)
// ============================================================================

/**
 * Enhanced Article with frontend-only fields for like functionality
 * Extends the original Article from API with additional tracking
 */
export interface EnhancedArticle extends Article {
  // Like tracking
  isLiked?: boolean;           // Frontend tracks if user liked this article
  
  // Similar article metadata
  isSimilar?: boolean;         // Frontend marks articles from ML recommendations
  sourceArticleId?: string;    // Frontend tracks which article triggered this recommendation
  
  // UI state
  isLikeLoading?: boolean;     // Frontend tracks if like API call is in progress
}

/**
 * Tracks pending similar article requests while user continues reading
 */
export interface PendingSimilarRequest {
  articleId: string;           // Which article was liked
  requestTime: number;         // When the API call started (timestamp)
  insertPosition: number;      // Where to insert similar articles in queue
  userPositionWhenLiked: number; // User's current position when they liked
}

/**
 * Response data when similar articles arrive from ML model
 */
export interface SimilarArticlesResult {
  sourceArticleId: string;     // Which article was liked
  similarArticles: EnhancedArticle[]; // The 5 similar articles (already enhanced)
  insertPosition: number;      // Where they should be inserted
}

/**
 * Like state management
 */
export interface LikeState {
  likedArticleIds: Set<string>;           // Set of liked article IDs
  pendingRequests: Map<string, PendingSimilarRequest>; // Ongoing API calls
  likeCounts: Map<string, number>;        // Cache like counts (optional)
}

/**
 * Queue operation types for managing article insertion
 */
export type QueueOperation = 
  | { type: 'INSERT_SIMILAR'; payload: SimilarArticlesResult }
  | { type: 'MARK_LIKED'; payload: { articleId: string; isLiked: boolean } }
  | { type: 'UPDATE_POSITION'; payload: { newIndex: number } };

// ============================================================================
// UTILITY TYPES FOR TRANSFORMATIONS
// ============================================================================

/**
 * Transform API Article to Enhanced Article
 */
export type ArticleTransformer = (article: Article, enhancements?: {
  isLiked?: boolean;
  isSimilar?: boolean;
  sourceArticleId?: string;
}) => EnhancedArticle;

/**
 * Transform API ArticleScore to Enhanced Article (for similar articles)
 */
export type ArticleScoreTransformer = (
  articleScore: ArticleScore, 
  sourceArticleId: string
) => EnhancedArticle;