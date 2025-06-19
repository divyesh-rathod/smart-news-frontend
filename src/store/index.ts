// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import newsReducer from './slices/newsSlice';
import { authApi } from './api/authApi';
import { newsApi } from './api/newsApi';

export const store = configureStore({
  reducer: {
    // Regular reducers
    auth: authReducer,
    news: newsReducer,
    
    // RTK Query API reducers
    [authApi.reducerPath]: authApi.reducer,
    [newsApi.reducerPath]: newsApi.reducer,
  },
  
  // Adding RTK Query middleware for caching, invalidation, polling, etc.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from serializability checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    })
    .concat(authApi.middleware)
    .concat(newsApi.middleware),
  
  // Enable Redux DevTools in development
  devTools: import.meta.env.MODE !== 'production',
});

// Enable listener behavior for RTK Query (refetchOnFocus, refetchOnReconnect)
setupListeners(store.dispatch);

// Type exports for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks for use throughout the app
export { useAppDispatch, useAppSelector } from './hooks';