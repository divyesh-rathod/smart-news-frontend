import { describe, expect, it } from 'vitest';
import { makeStore } from './index';
import { newsApi } from './api/newsApi';
import { signOut } from './signOut';
import { setAllArticles } from './slices/newsSlice';
import { feedArticle, json, mockApi } from '../test/api';
import type { EnhancedArticle } from '../types/articleTypes';

describe('signOut', () => {
  it("forgets the previous user's feed, likes and cached responses", async () => {
    const page = { results: [feedArticle(1, { liked: true })], next_cursor: null };
    mockApi({ 'GET /news/unseen-articles': () => json(page) });
    const store = makeStore();
    await store.dispatch(newsApi.endpoints.getUnseenArticles.initiate({ limit: 20 }));
    store.dispatch(setAllArticles(page.results as EnhancedArticle[]));

    store.dispatch(signOut());

    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.news).toEqual(makeStore().getState().news);
    expect(state.newsApi.queries).toEqual({});
  });
});
