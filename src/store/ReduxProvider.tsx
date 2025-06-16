import React, { useEffect } from 'react';
import {  Provider } from 'react-redux';
import { store } from './index';
import { restoreAuth } from './slices/authSlice';

interface ReduxProviderProps {
  children: React.ReactNode;
}

const ReduxProvider = ({ children }: ReduxProviderProps) => {
    useEffect(() => {
        // Restore authentication state from localStorage on app startup
        store.dispatch(restoreAuth());
    }, []);

    return (
        <Provider store={store}>
          {children}
        </Provider>
      );
};

export default ReduxProvider;