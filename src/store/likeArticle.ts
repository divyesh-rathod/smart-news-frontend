import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { newsApi } from './api/newsApi';
import { likeFailed, likeRequested, likeSucceeded, recommendationsArrived } from './slices/newsSlice';
import type { RootState } from './index';

export interface LikeOutcome {
  liked: boolean;
  recommendationsAdded: number;
}

export const LIKE_FAILED_MESSAGE = "Couldn't save your like. Please try again.";

/**
 * Like or unlike an article (by default the one on screen): optimistic, rolled back with a message if
 * the request fails. While a request for an article is in flight, further presses for it are ignored.
 * Everything is read from the store at call time, so a keyboard handler from an older render can't act
 * on stale state. Resolves to null when ignored or failed.
 */
export const toggleArticleLike =
  (articleId?: string): ThunkAction<Promise<LikeOutcome | null>, RootState, unknown, UnknownAction> =>
  async (dispatch, getState) => {
    const { news } = getState();
    const id = articleId ?? news.currentArticle?.article_id;
    if (!id || id in news.likeRequests) return null;

    const liked = !news.likedArticleIds.includes(id);
    dispatch(likeRequested({ articleId: id, liked }));
    const request = dispatch(newsApi.endpoints.setArticleLike.initiate({ articleId: id, liked }));
    try {
      const result = await request.unwrap();
      dispatch(likeSucceeded({ articleId: id, liked: result.liked }));
      const before = getState().news.allArticles.length;
      if (result.liked) {
        dispatch(recommendationsArrived({ sourceArticleId: id, articles: result.recommendations }));
      }
      return { liked: result.liked, recommendationsAdded: getState().news.allArticles.length - before };
    } catch {
      dispatch(likeFailed({ articleId: id, message: LIKE_FAILED_MESSAGE }));
      return null;
    } finally {
      request.reset();
    }
  };
