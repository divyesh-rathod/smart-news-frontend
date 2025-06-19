import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import LoginPage from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import SignupPage from '../pages/Signup';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import Layout from '../components/layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      // Redirect root to dashboard or login based on auth
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      
      // Public routes (redirect to dashboard if already authenticated)
      {
        path: '/login',
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: '/signup',
        element: (
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        ),
      },
      
      // Protected routes (require authentication)
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        ),
      },
      // {
      //   path: '/news',
      //   element: (
      //     <ProtectedRoute>
      //       <Layout>
      //         <News />
      //       </Layout>
      //     </ProtectedRoute>
      //   ),
      // },
      // {
      //   path: '/news/:articleId',
      //   element: (
      //     <ProtectedRoute>
      //       <Layout>
      //         <ArticleDetail />
      //       </Layout>
      //     </ProtectedRoute>
      //   ),
      // },
      // {
      //   path: '/profile',
      //   element: (
      //     <ProtectedRoute>
      //       <Layout>
      //         <Profile />
      //       </Layout>
      //     </ProtectedRoute>
      //   ),
      // },
      
      // Catch-all route for 404
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
]);

export default router;