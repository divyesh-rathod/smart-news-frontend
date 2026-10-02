import { describe, expect, it, vi } from 'vitest';
import { makeStore } from '../store';
import { authApi } from '../store/api/authApi';
import { newsApi } from '../store/api/newsApi';

describe('API base URL', () => {
  it('is the same for the auth and news APIs, and defaults to the port uvicorn serves on', async () => {
    const urls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (request: Request) => {
      urls.push(request.url);
      const body = JSON.stringify({ results: [], next_cursor: null });
      return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    const store = makeStore();

    await store.dispatch(authApi.endpoints.login.initiate({ email: 'reader@example.com', password: 'secret' }));
    await store.dispatch(newsApi.endpoints.getUnseenArticles.initiate({ limit: 20 }));

    expect(urls.map((url) => new URL(url).origin)).toEqual(['http://localhost:8000', 'http://localhost:8000']);
  });
});
