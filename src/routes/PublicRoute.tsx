import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Get the intended destination from location state, or default to dashboard
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // If already authenticated, redirect to intended destination or dashboard
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // If not authenticated, show the public route (login/signup)
  return <>{children}</>;
};

export default PublicRoute;