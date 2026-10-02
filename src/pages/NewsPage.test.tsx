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

  it('asks for the next page with the cursor from the previous one', async () => {
    const calls = mockApi({
      'GET /news/unseen-articles': (call) =>
        call.query?.cursor === 'cursor-after-a3'
          ? json({ results: [feedArticle(4)], next_cursor: null })
          : json({ results: [feedArticle(1), feedArticle(2), feedArticle(3)], next_cursor: 'cursor-after-a3' }),
      'POST /news/mark-as-read/*': () => json('ok'),
    });
    const user = userEvent.setup();
    renderWithStore(<NewsPage />);
    await screen.findByText('Feed article 1');

    await user.click(screen.getByRole('button', { name: /next/i }));

    await screen.findByText('Article 2 of 4');
    const feedQueries = calls.filter((call) => call.path === '/news/unseen-articles').map((call) => call.query?.cursor);
    expect(feedQueries).toEqual([undefined, 'cursor-after-a3']);
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
