import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './slices/authSlice';
import { authApi } from './api/authApi';

export const store = configureStore({
  reducer: {
    // Regular reducers
    auth: authReducer,
    
    // RTK Query API reducers
    [authApi.reducerPath]: authApi.reducer,
  },
  
  // Adding RTK Query middleware for caching, invalidation, polling, etc.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from serializability checks
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(authApi.middleware),
  
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