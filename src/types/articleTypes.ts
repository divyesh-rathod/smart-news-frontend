// src/types/articleTypes.ts
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
}

export interface ArticlesResponse {
  results: Article[];
  next_cursor: string | null;
}

// Additional interfaces for API responses
export interface ArticleScore {
  article_id: string;
  cleaned_text: string;
  category_1: string | null;
  category_2: string | null;
  score: number;
}

export interface ToggleLikeResponse {
  message: string;
  liked: boolean;
  top5: ArticleScore[];
  similar: ArticleScore[];
}