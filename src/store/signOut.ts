import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { newsApi } from './api/newsApi';
import { logout } from './slices/authSlice';
import { resetNewsState } from './slices/newsSlice';
import type { RootState } from './index';

/**
 * Log out and forget everything that belonged to the user: the reading list, likes, and cached API
 * responses. Without the cache reset, the next user to log in within 5 minutes got the previous
 * user's cached feed page, liked flags included.
 */
export const signOut = (): ThunkAction<void, RootState, unknown, UnknownAction> => (dispatch) => {
  dispatch(logout());
  dispatch(resetNewsState());
  dispatch(newsApi.util.resetApiState());
  dispatch(authApi.util.resetApiState());
};
