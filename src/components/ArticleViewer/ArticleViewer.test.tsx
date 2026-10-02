import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ArticleViewer from './ArticleViewer';
import { useNews } from '../../hooks/useNews';
import {
  type ApiCall,
  deferred,
  feedArticle,
  json,
  mockApi,
  recommendation,
  renderWithStore,
} from '../../test/api';

type LikeHandler = (call: ApiCall) => Response | Promise<Response>;

const liked = (top5: unknown[] = []) => json({ message: 'Article liked', liked: true, top5, similar: [] });

function Viewer() {
  return <ArticleViewer news={useNews()} />;
}

function setup(likeHandler: LikeHandler, feed = [feedArticle(1), feedArticle(2), feedArticle(3)]) {
  const calls = mockApi({
    'GET /news/unseen-articles': () => json({ results: feed, next_cursor: null }),
    'POST /news/mark-as-read/*': () => json('ok'),
    'PUT /news/like/*': likeHandler,
    'POST /news/toggle-like/*': likeHandler,
  });
  const user = userEvent.setup();
  renderWithStore(<Viewer />);
  return { calls, user };
}

const likeCalls = (calls: ApiCall[]) => calls.filter((call) => call.path.includes('like'));
const likeButton = () => screen.getByRole('button', { name: /like this article/i });
const title = () => screen.getByRole('heading', { level: 1 }).textContent;

async function goNext(user: ReturnType<typeof userEvent.setup>) {
  const next = screen.getByRole('button', { name: /next/i });
  await waitFor(() => expect(next).toBeEnabled());
  await user.click(next);
}

describe('liking an article', () => {
  it('shows the like at once and sends one request however often it is pressed meanwhile', async () => {
    const response = deferred<Response>();
    const { calls, user } = setup(() => response.promise);
    await screen.findByText('Feed article 1');

    await user.click(likeButton());
    expect(likeButton()).toHaveAccessibleName('Unlike this article');
    await user.click(likeButton());
    await user.keyboard(' ');
    await user.keyboard('f');
    expect(likeCalls(calls)).toHaveLength(1);

    response.resolve(liked());
    await waitFor(() => expect(likeButton()).toBeEnabled());
    expect(likeButton()).toHaveAccessibleName('Unlike this article');
    expect(likeCalls(calls)).toHaveLength(1);
  });

  it('puts the like back and says so when saving it fails', async () => {
    const { user } = setup(() => json({ detail: 'An unexpected error occurred' }, 500));
    await screen.findByText('Feed article 1');

    await user.click(likeButton());

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t save your like/i);
    expect(likeButton()).toHaveAccessibleName('Like this article');
  });

  it('shows likes saved in an earlier session, and pressing Like then removes the like', async () => {
    const { calls, user } = setup(
      () => json({ message: 'Like removed', liked: false, top5: [], similar: [] }),
      [feedArticle(1, { liked: true }), feedArticle(2)],
    );
    await screen.findByText('Feed article 1');
    expect(likeButton()).toHaveAccessibleName('Unlike this article');

    await user.click(likeButton());

    await waitFor(() => expect(likeButton()).toHaveAccessibleName('Like this article'));
    expect(likeCalls(calls)).toEqual([{ method: 'PUT', path: '/news/like/a1', body: { liked: false } }]);
  });

  it('likes the article on screen when the keyboard shortcut is used after navigating', async () => {
    const { calls, user } = setup(() => liked());
    await screen.findByText('Feed article 1');
    await goNext(user);
    await screen.findByText('Feed article 2');

    await user.keyboard('f');

    await waitFor(() => expect(likeCalls(calls)).toHaveLength(1));
    expect(likeCalls(calls)[0].path).toMatch(/\/a2$/);
  });
});

describe('navigation', () => {
  it('keeps Next and Previous usable after scrolling down to the like button', async () => {
    setup(() => liked());
    await screen.findByText('Feed article 1');
    const header = screen.getByRole('button', { name: /next/i }).closest('.navigation-header');

    Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });
    try {
      fireEvent.scroll(window);
      await new Promise((resolve) => setTimeout(resolve, 100)); // the hook debounces, then waits a frame

      expect(header).toHaveClass('header-scrolled');
      expect(header).not.toHaveClass('header-hidden');
    } finally {
      Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
    }
  });
});

describe('recommendations from a like', () => {
  it('come next, right after the current article, and are added once', async () => {
    const { user } = setup(() => liked([1, 2, 3, 4, 5].map(recommendation)));
    await screen.findByText('Feed article 1');

    await user.click(likeButton());
    await screen.findByText('Article 1 of 8');

    for (const n of [1, 2, 3, 4, 5]) {
      await goNext(user);
      await waitFor(() => expect(title()).toBe(`Recommended article ${n}`));
    }
    await goNext(user);
    await waitFor(() => expect(title()).toBe('Feed article 2'));
    expect(screen.getByText('Article 7 of 8')).toBeInTheDocument();
  });

  it('that arrive after the reader moved on go after the article being read then', async () => {
    const response = deferred<Response>();
    const { user } = setup(() => response.promise, [1, 2, 3, 4].map((n) => feedArticle(n)));
    await screen.findByText('Feed article 1');

    await user.click(likeButton());
    await goNext(user);
    await goNext(user);
    await waitFor(() => expect(title()).toBe('Feed article 3'));
    response.resolve(liked([recommendation(1), recommendation(2)]));

    await screen.findByText('Article 3 of 6');
    expect(title()).toBe('Feed article 3');
    await goNext(user);
    await waitFor(() => expect(title()).toBe('Recommended article 1'));
  });

  it('skip articles that are already in the feed', async () => {
    const alreadyInFeed = { ...recommendation(0), article_id: 'a2', title: 'Feed article 2' };
    const { user } = setup(() => liked([alreadyInFeed, recommendation(1)]));
    await screen.findByText('Feed article 1');

    await user.click(likeButton());

    await screen.findByText('Article 1 of 4');
    await goNext(user);
    await waitFor(() => expect(title()).toBe('Recommended article 1'));
    await goNext(user);
    await waitFor(() => expect(title()).toBe('Feed article 2'));
  });
});
