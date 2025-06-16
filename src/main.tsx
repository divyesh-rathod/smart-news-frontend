import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ReduxProvider from './store/ReduxProvider';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReduxProvider>
      <RouterProvider router={router} />
    </ReduxProvider>
  </StrictMode>,
);