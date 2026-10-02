import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('does not refetch the feed when an article is marked as read', async () => {
    // Each feed request moves the server's feed cursor on by a page, so a refetch whose results are
    // ignored skips those unseen articles for good.
    const calls = mockApi({
      'GET /news/unseen-articles': () => json({ results: [feedArticle(1), feedArticle(2)], next_cursor: null }),
      'POST /news/mark-as-read/*': () => json('Article marked as read successfully'),
    });
    const user = userEvent.setup();
    renderWithStore(<NewsPage />);
    await screen.findByText('Feed article 1');

    await user.click(screen.getByRole('button', { name: /mark as read/i }));

    await waitFor(() => expect(calls.some((call) => call.path.startsWith('/news/mark-as-read'))).toBe(true));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls.filter((call) => call.path === '/news/unseen-articles')).toHaveLength(1);
  });
});
