# Smart News — frontend

A React + TypeScript reader for the [Smart News backend](https://github.com/divyesh-rathod/Smart-News-Backend). It shows one article at a time from the reader's unread feed. Liking an article saves the like and puts five similar articles, ranked by the backend's recommender, right after the article being read.

## What it does

- **Sign up and log in.** JWT from the backend, kept in `localStorage`; protected routes redirect to `/login`.
- **One article at a time.** Next and Previous, or keyboard shortcuts:
  - ← → or H L: navigate
  - Space or F: like
  - R: mark as read
  - Enter: open the article
  
  The next page of the feed is fetched when the reader is three articles from the end.
- **Automatic mark-as-read.** An article stays on screen for 10 seconds → it's marked as read, once.
- **Likes with recommendations**, described below.
- **Logout** clears the reading list, likes and cached API responses, so the next user starts clean.

## How a like works

The button is optimistic: it shows the new state at once, and the request is `PUT /news/like/{id}` with the state the reader wants (`{"liked": true|false}`), so repeating it is harmless. The flow lives in `src/store/likeArticle.ts` and `src/store/slices/newsSlice.ts`.

- **One request per article at a time.** While a like is saving, the button is busy and further presses for that article (clicks, Space, F) are ignored. The check reads the store at the moment of the press, so a keyboard handler from an older render can't send a stale toggle.
- **Rollback.** If the request fails, the button goes back to what it was before and an alert says "Couldn't save your like. Please try again."
- **Server state wins.** The server's answer is written back after every request, and each feed page says which articles are already liked, so a like from an earlier session shows correctly after a reload.
- **Recommendations come next.** The like response carries the top 5. They're inserted right after the article on screen *when the response arrives* (which may be later than the liked article, if the reader moved on). Articles already in the list are skipped, and the reader is told "Added N similar articles up next".

There's no request cancellation: aborting the request wouldn't undo the like on the server, it would only lose the server's answer.

## Tech stack

- React 19, TypeScript 5.8 (strict), Vite 6
- Redux Toolkit 2.8 with RTK Query for API calls
- React Router 7
- Material UI 7 for the layout and auth pages; custom CSS for the reader
- React Hook Form + Zod for the auth forms
- Vitest 4 + React Testing Library + jsdom for tests

## Getting started

Requirements: Node.js 24 (what CI uses) and the backend running on port 8000.

```bash
npm ci
npm run dev    # http://localhost:5173
```

The API defaults to `http://localhost:8000/api/V1`. To point elsewhere, create `.env.local`:

```env
VITE_API_BASE_URL=https://your-backend.example.com/api/V1
```

The backend allows CORS from `localhost:5173` and `localhost:3000`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | type-check and build into `dist/` |
| `npm run preview` | serve the built app |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc -b` |
| `npm test` | Vitest, once |

## Tests

20 tests. Components run against a real store, with `fetch` replaced by route handlers (`src/test/api.tsx`). Responses can be held back with `deferred()`, so a test can like an article, navigate twice, and only then let the response arrive.

- `ArticleViewer.test.tsx`:
  - the optimistic like, and one request despite clicks and shortcuts while saving
  - rollback with an alert
  - likes from an earlier session
  - the shortcut acting on the article on screen
  - recommendations placed next and added once, even when they arrive late
  - duplicates skipped
- `likeArticle.test.ts`: the response transform, the request body, two presses in one tick, the server's answer winning, a failed unlike staying liked, feed pages not overriding a like in flight.
- `NewsPage.test.tsx`: one mark-as-read per article; marking an article read doesn't refetch the feed. Each feed request advances the backend's feed cursor, so a refetch skips unread articles.
- `signOut.test.ts`, `config/api.test.ts`: logout resets user data; both APIs use the same base URL.

GitHub Actions runs `npm ci`, lint, typecheck, test and build on Node 24.

## Project structure

```
src/
  components/
    ArticleViewer/     the reader: article, navigation, like button, shortcuts
    layout.tsx         app bar and navigation
  config/api.ts        API base URL
  hooks/useNews.ts     feed, navigation, read timer, likes (one instance per page, passed down)
  pages/               Login, Signup, Dashboard, NewsPage, NotFound
  routes/              route table, protected and public routes
  store/
    api/               RTK Query: authApi, newsApi
    slices/            authSlice, newsSlice (reading list, likes)
    likeArticle.ts     the like flow
    signOut.ts         logout and reset
  test/                test setup and API mocks
  types/               API and app types
```

## Known limitations

- **No token refresh.** When the token expires (15 days by default), API calls fail until the reader logs out and in again.
- **Feed paging follows a cursor the backend stores per user.** Reloading the page skips the unread rest of the previous page; see the backend README.
- **Recommendations can include articles the reader has already read** in an earlier session. Only articles in the current list are skipped.
- **A press during a like request is dropped, not queued.**

## License

MIT, see [LICENSE](LICENSE).
