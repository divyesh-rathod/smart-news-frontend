import { act, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import NewsPage from './NewsPage';
import { feedArticle, json, mockApi, renderWithStore } from '../test/api';

describe('NewsPage', () => {
  it('marks the article on screen as read once, after 10 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = mockApi({
      'GET /news/unseen-articles': () => json({ results: [feedArticle(1), feedArticle(2)], next_cursor: null }),
      'POST /news/mark-as-read/*': () => json('Article marked as read successfully'),
    });
    renderWithStore(<NewsPage />);
    await screen.findByText('Feed article 1');

    await act(async () => {
      vi.advanceTimersByTime(10_500);
    });

    const markCalls = () => calls.filter((call) => call.path.startsWith('/news/mark-as-read'));
    await waitFor(() => expect(markCalls().length).toBeGreaterThan(0));
    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(markCalls()).toEqual([{ method: 'POST', path: '/news/mark-as-read/a1', body: undefined }]);
  });
});
