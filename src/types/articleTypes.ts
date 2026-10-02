// src/types/articleTypes.ts
// ============================================================================
// API TYPES (match app/schemas/news_schema.py in the backend)
// ============================================================================

export interface Article {
  article_id: string;
  cleaned_text: string;
  category_1: string | null;
  category_2: string | null;
  processed_at: string;
  pub_date: string;
  title: string;
  link: string;
  description: string | null;
  categories: string[] | null;
  liked: boolean; // the user's like when the feed page was fetched
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
  category_1: string | null;
  category_2: string | null;
  score: number;
}

export interface LikeResponse {
  message: string;
  liked: boolean;
  top5: ArticleScore[];
  similar: ArticleScore[];
}

// ============================================================================
// FRONTEND TYPES
// ============================================================================

/** An article in the reading list. Recommended ones remember which like brought them in. */
export interface EnhancedArticle extends Article {
  isSimilar?: boolean;
  sourceArticleId?: string;
}

/** What PUT /news/like/{id} means for the reading list. */
export interface LikeResult {
  liked: boolean;
  recommendations: EnhancedArticle[];
}
