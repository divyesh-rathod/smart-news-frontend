import { describe, expect, it } from 'vitest';
import { makeStore } from './index';
import { newsApi, toRecommendedArticle } from './api/newsApi';
import { LIKE_FAILED_MESSAGE, toggleArticleLike } from './likeArticle';
import { appendArticles, setAllArticles } from './slices/newsSlice';
import { deferred, feedArticle, json, mockApi, recommendation } from '../test/api';
import type { EnhancedArticle } from '../types/articleTypes';

const article = (n: number, overrides: Partial<EnhancedArticle> = {}) => feedArticle(n, overrides) as EnhancedArticle;

function storeWithFeed(feed: EnhancedArticle[]) {
  const store = makeStore();
  store.dispatch(setAllArticles(feed));
  return store;
}

describe('toRecommendedArticle', () => {
  it('turns a ranked result into a reading-list article that remembers its source', () => {
    expect(toRecommendedArticle(recommendation(1), 'a1')).toMatchObject({
      article_id: 'r1',
      title: 'Recommended article 1',
      link: 'https://example.com/r1',
      cleaned_text: 'text of recommended article 1',
      description: 'text of recommended article 1',
      category_1: 'Business',
      categories: ['Business'],
      isSimilar: true,
      sourceArticleId: 'a1',
    });
  });

  it('gives an article without a category no categories', () => {
    expect(toRecommendedArticle({ ...recommendation(1), category_1: null }, 'a1').categories).toBeNull();
  });
});

describe('setArticleLike', () => {
  it('sends the wanted state and maps top5 to recommendations', async () => {
    const calls = mockApi({
      'PUT /news/like/a1': () => json({ message: 'Article liked', liked: true, top5: [recommendation(1)], similar: [] }),
    });
    const store = makeStore();

    const result = await store.dispatch(newsApi.endpoints.setArticleLike.initiate({ articleId: 'a1', liked: true })).unwrap();

    expect(calls).toEqual([{ method: 'PUT', path: '/news/like/a1', body: { liked: true } }]);
    expect(result.liked).toBe(true);
    expect(result.recommendations.map((a) => [a.article_id, a.sourceArticleId])).toEqual([['r1', 'a1']]);
  });
});

describe('toggleArticleLike', () => {
  it('ignores a second press for the same article in the same tick', async () => {
    const response = deferred<Response>();
    const calls = mockApi({ 'PUT /news/like/a1': () => response.promise });
    const store = storeWithFeed([article(1)]);

    const first = store.dispatch(toggleArticleLike('a1'));
    const second = store.dispatch(toggleArticleLike('a1'));
    response.resolve(json({ message: 'Article liked', liked: true, top5: [], similar: [] }));

    expect(await second).toBeNull();
    expect(await first).toEqual({ liked: true, recommendationsAdded: 0 });
    expect(calls).toHaveLength(1);
  });

  it("shows the server's answer when it differs from the optimistic guess", async () => {
    mockApi({ 'PUT /news/like/a1': () => json({ message: 'Like removed', liked: false, top5: [], similar: [] }) });
    const store = storeWithFeed([article(1)]);

    await store.dispatch(toggleArticleLike('a1'));

    expect(store.getState().news.likedArticleIds).toEqual([]);
  });

  it('keeps an article liked when unliking it fails', async () => {
    mockApi({ 'PUT /news/like/a1': () => json({ detail: 'An unexpected error occurred' }, 500) });
    const store = storeWithFeed([article(1, { liked: true })]);

    expect(await store.dispatch(toggleArticleLike('a1'))).toBeNull();

    const { news } = store.getState();
    expect(news.likedArticleIds).toEqual(['a1']);
    expect(news.likeRequests).toEqual({});
    expect(news.likeError).toBe(LIKE_FAILED_MESSAGE);
  });

  it('clears the previous error when the next like starts', async () => {
    const response = deferred<Response>();
    let attempt = 0;
    mockApi({ 'PUT /news/like/a1': () => (++attempt === 1 ? json({}, 500) : response.promise) });
    const store = storeWithFeed([article(1)]);
    await store.dispatch(toggleArticleLike('a1'));

    const retry = store.dispatch(toggleArticleLike('a1'));

    expect(store.getState().news.likeError).toBeNull();
    response.resolve(json({ message: 'Article liked', liked: true, top5: [], similar: [] }));
    await retry;
  });
});

describe('feed pages and likes', () => {
  it("take the server's like state, except for an article whose like is in flight", async () => {
    const response = deferred<Response>();
    mockApi({ 'PUT /news/like/a2': () => response.promise });
    const store = storeWithFeed([article(1, { liked: true }), article(2)]);
    const pending = store.dispatch(toggleArticleLike('a2'));

    store.dispatch(appendArticles([article(2, { liked: false }), article(3, { liked: true })]));

    expect([...store.getState().news.likedArticleIds].sort()).toEqual(['a1', 'a2', 'a3']);
    response.resolve(json({ message: 'Article liked', liked: true, top5: [], similar: [] }));
    await pending;
  });
});
