// Navigation utilities and route constants

export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    SIGNUP: '/signup',
    DASHBOARD: '/dashboard',
    NEWS: '/news',
    ARTICLE: (id: string) => `/news/${id}`,
    PROFILE: '/profile',
  } as const;
  
  // Type for route values
  export type RouteValue = typeof ROUTES[keyof typeof ROUTES] | ReturnType<typeof ROUTES.ARTICLE>;
  
  // Route metadata for navigation
  export const ROUTE_METADATA = {
    [ROUTES.DASHBOARD]: {
      title: 'Dashboard',
      requiresAuth: true,
      showInNav: true,
    },
    [ROUTES.NEWS]: {
      title: 'News',
      requiresAuth: true,
      showInNav: true,
    },
    [ROUTES.PROFILE]: {
      title: 'Profile',
      requiresAuth: true,
      showInNav: true,
    },
    [ROUTES.LOGIN]: {
      title: 'Login',
      requiresAuth: false,
      showInNav: false,
    },
    [ROUTES.SIGNUP]: {
      title: 'Sign Up',
      requiresAuth: false,
      showInNav: false,
    },
  } as const;
  
  // Helper function to check if a route requires authentication
  export const isProtectedRoute = (pathname: string): boolean => {
    // Check exact matches first
    const routeMetadata = Object.entries(ROUTE_METADATA).find(([route]) => route === pathname);
    if (routeMetadata) {
      return routeMetadata[1].requiresAuth;
    }
    
    // Check dynamic routes (like /news/:id)
    if (pathname.startsWith('/news/') && pathname !== '/news') {
      return true; // Article detail pages require auth
    }
    
    // Default to requiring auth for unknown routes
    return true;
  };
  
  // Helper function to get route title
  export const getRouteTitle = (pathname: string): string => {
    const routeMetadata = Object.entries(ROUTE_METADATA).find(([route]) => route === pathname);
    if (routeMetadata) {
      return routeMetadata[1].title;
    }
    
    // Handle dynamic routes
    if (pathname.startsWith('/news/') && pathname !== '/news') {
      return 'Article';
    }
    
    return 'Page';
  };