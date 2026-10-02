import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import { makeStore, type AppStore } from '../store';

export interface ApiCall {
  method: string;
  path: string;
  body: unknown;
  query?: Record<string, string>; // only when the URL has a query string
}

type Handler = (call: ApiCall) => Response | Promise<Response>;

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** A promise the test resolves by hand, to control when a response arrives. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}

/**
 * Replace fetch with handlers keyed by "METHOD /path" (path after /api/V1, without the query string).
 * Returns every call made, in order.
 */
export function mockApi(routes: Record<string, Handler>): ApiCall[] {
  const calls: ApiCall[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: Request) => {
    const url = new URL(input.url);
    const path = url.pathname.replace(/^\/api\/V1/, '');
    const text = input.method === 'GET' ? '' : await input.text();
    const call: ApiCall = { method: input.method, path, body: text ? JSON.parse(text) : undefined };
    if (url.search) call.query = Object.fromEntries(url.searchParams);
    calls.push(call);
    const handler = routes[`${call.method} ${call.path}`]
      ?? Object.entries(routes).find(([key]) => key.endsWith('*') && `${call.method} ${call.path}`.startsWith(key.slice(0, -1)))?.[1];
    return handler ? handler(call) : json({ detail: `No mock for ${call.method} ${call.path}` }, 404);
  }));
  return calls;
}

export function renderWithStore(ui: ReactElement, store: AppStore = makeStore()) {
  return { store, ...render(<Provider store={store}>{ui}</Provider>) };
}

export const feedArticle = (n: number, overrides: Record<string, unknown> = {}) => ({
  article_id: `a${n}`,
  title: `Feed article ${n}`,
  cleaned_text: `text of feed article ${n}`,
  category_1: 'News',
  category_2: `text of feed article ${n} news`,
  processed_at: '2026-10-01T10:00:00Z',
  pub_date: '2026-10-01T10:00:00Z',
  link: `https://example.com/a${n}`,
  description: `description ${n}`,
  categories: ['News'],
  liked: false,
  ...overrides,
});

export const recommendation = (n: number) => ({
  article_id: `r${n}`,
  title: `Recommended article ${n}`,
  link: `https://example.com/r${n}`,
  cleaned_text: `text of recommended article ${n}`,
  category_1: 'Business',
  category_2: `text of recommended article ${n} business`,
  score: 10 - n,
});
