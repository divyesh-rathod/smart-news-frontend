import { describe, expect, it } from 'vitest';
import { store } from './index';

describe('store', () => {
  it('starts with an empty news feed and no liked articles', () => {
    const { news } = store.getState();

    expect(news.allArticles).toEqual([]);
    expect(news.likedArticleIds).toEqual([]);
    expect(news.currentIndex).toBe(0);
  });
});
