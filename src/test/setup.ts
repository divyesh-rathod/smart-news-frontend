import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Node 25's built-in localStorage is inert without --localstorage-file and shadows jsdom's (CI's Node 24 doesn't).
if (typeof globalThis.localStorage?.clear !== 'function') {
  const { jsdom } = globalThis as unknown as { jsdom: { window: Window } };
  Object.defineProperty(globalThis, 'localStorage', { value: jsdom.window.localStorage, configurable: true });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  localStorage.clear();
});
