# Smart News Frontend

A modern, responsive React TypeScript application for personalized news recommendation powered by machine learning. This frontend provides an intuitive interface for browsing AI-curated news articles with intelligent recommendation features.

## 🚀 Overview

Smart News Frontend is a sophisticated web application that connects to an ML-powered backend to deliver personalized news experiences. Users can browse articles, like content to receive similar recommendations, and enjoy a seamless news consumption experience.

### ✨ Key Features

- **🤖 AI-Powered Recommendations**: ML-driven similar article suggestions based on user interactions
- **👤 User Authentication**: Secure login/signup system with JWT tokens
- **📱 Responsive Design**: Mobile-first design with dark theme
- **⚡ Real-time Interactions**: Like articles to instantly receive similar content
- **🔒 Protected Routing**: Secure access to personalized content
- **🎯 Advanced State Management**: Redux Toolkit with RTK Query for optimal performance
- **📊 Article Analytics**: Track reading behavior and preferences
- **🔄 Infinite Scrolling**: Seamless article loading with cursor-based pagination

## 🏗️ Tech Stack

### Core Technologies
- **Frontend Framework**: React 19.1.0
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 6.3.5
- **Styling**: Custom CSS (No Tailwind)

### State Management & API
- **State Management**: Redux Toolkit 2.8.2
- **API Client**: RTK Query
- **HTTP Client**: Axios 1.9.0

### UI & UX
- **Component Library**: Material-UI 7.1.1
- **Icons**: Material-UI Icons
- **Styling Engine**: Emotion (React/Styled)

### Forms & Validation
- **Form Management**: React Hook Form 7.57.0
- **Schema Validation**: Zod 3.25.61
- **Form Resolvers**: @hookform/resolvers 5.1.1

### Routing & Navigation
- **Router**: React Router DOM 7.6.2
- **Protected Routes**: Custom implementation

### Development Tools
- **Linting**: ESLint 9.25.0
- **Type Checking**: TypeScript ESLint 8.30.1
- **Development Server**: Vite Dev Server

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ArticleViewer/   # Main article display component
│   ├── LikeButton/      # Article like functionality
│   └── layout/          # Layout components
├── pages/               # Page components
│   ├── Login.tsx        # Authentication page
│   ├── Signup.tsx       # User registration
│   ├── NewsPage.tsx     # Main news browsing
│   ├── Dashboard.tsx    # User dashboard
│   └── NotFound.tsx     # 404 page
├── store/               # Redux store configuration
│   ├── api/             # RTK Query API definitions
│   │   ├── authApi.tsx  # Authentication endpoints
│   │   └── newsApi.tsx  # News & articles endpoints
│   ├── slices/          # Redux slices
│   │   ├── authSlice.ts # Authentication state
│   │   └── newsSlice.ts # News & articles state
│   ├── hooks.ts         # Typed Redux hooks
│   └── index.ts         # Store configuration
├── routes/              # Routing configuration
│   ├── index.tsx        # Route definitions
│   ├── ProtectedRoute.tsx # Auth-required routes
│   └── PublicRoute.tsx  # Public access routes
├── hooks/               # Custom React hooks
│   └── useNews.ts       # News-specific logic
├── types/               # TypeScript type definitions
│   ├── authTypes.ts     # Authentication types
│   ├── articleTypes.ts  # Article & news types
│   └── commonTypes.ts   # Shared type definitions
├── schemas/             # Zod validation schemas
│   └── authSchemas.ts   # Form validation schemas
├── utils/               # Utility functions
│   └── errorUtils.ts    # Error handling utilities
└── App.tsx              # Root application component
```

## 🚦 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js**: 18.0+ 
- **npm**: 8.0+ or **yarn**: 1.22+
- **Git**: Latest version

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd smart-news-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the project root:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api/V1
   VITE_APP_NAME=Smart News
   VITE_APP_VERSION=1.0.0
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
yarn build
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API endpoint | `http://localhost:8080/api/V1` |
| `VITE_APP_NAME` | Application name | `Smart News` |
| `VITE_APP_VERSION` | App version | `1.0.0` |

### API Endpoints

The frontend connects to these backend endpoints:

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/signup` - User registration  
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

#### News & Articles
- `GET /news/unseen-articles` - Fetch personalized articles
- `POST /news/toggle-like` - Like/unlike articles (triggers ML recommendations)
- `POST /news/mark-read` - Mark articles as read
- `POST /news/set-date` - Set last read date

#### User Management
- `GET /users/me` - Get current user profile
- `PUT /users/update` - Update user profile

## 🎯 Core Features

### 1. Authentication System

**Login & Signup**
- Form validation with Zod schemas
- JWT token management
- Automatic token refresh
- Secure route protection

**Implementation**
```typescript
// Protected route example
<ProtectedRoute>
  <Layout>
    <NewsPage />
  </Layout>
</ProtectedRoute>
```

### 2. News Article System

**Article Browsing**
- Infinite scroll with cursor-based pagination
- Real-time article loading
- Mobile-responsive card layout
- Article metadata display

**Like Functionality**
- Instant UI feedback
- ML-powered similar article suggestions
- Smart article insertion into feed
- Optimistic UI updates

### 3. State Management

**Redux Architecture**
```typescript
// Store structure
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    isLoading: boolean
  },
  news: {
    currentIndex: number,
    allArticles: EnhancedArticle[],
    likedArticleIds: Set<string>,
    currentArticle: EnhancedArticle | null,
    hasMoreArticles: boolean,
    nextCursor: string | null
  }
}
```

**RTK Query Benefits**
- Automatic caching
- Background refetching
- Optimistic updates
- Error handling
- Loading states

### 4. Routing System

**Route Structure**
- `/` - Redirects to dashboard
- `/login` - Public login page
- `/signup` - Public registration page
- `/dashboard` - Protected user dashboard
- `/news` - Protected news browsing
- `*` - 404 Not Found page

## 🎨 Styling Guidelines

### CSS Architecture

**Custom CSS Approach**
- No Tailwind CSS (as per requirements)
- Component-scoped CSS files
- CSS custom properties for theming
- Mobile-first responsive design

**Example Component Styling**
```css
/* Component-specific styles */
.news-page-container {
  min-height: 100vh;
  background-color: #000;
  color: #fff;
  font-family: Arial, sans-serif;
}

/* Mobile-first responsive */
@media (max-width: 768px) {
  .news-page-header {
    padding: 1.5rem 1rem;
  }
}
```

### Design System

**Color Palette**
- Primary: `#007bff`
- Background: `#000000`
- Text: `#ffffff`
- Secondary: `#333333`
- Accent: `#cccccc`

**Typography**
- Primary Font: Arial, sans-serif
- Heading sizes: 2.5rem, 2rem, 1.75rem
- Body text: 1rem, 1.1rem

## 🔌 API Integration

### Authentication Flow

```typescript
// Login example
const handleLogin = async (credentials: LoginFormData) => {
  try {
    const result = await loginMutation(credentials).unwrap();
    dispatch(loginSuccess({
      user: result.user,
      token: result.access_token
    }));
  } catch (error) {
    dispatch(loginFailure());
  }
};
```

### News Data Flow

```typescript
// Article fetching with RTK Query
const {
  currentArticle,
  currentIndex,
  totalArticles,
  isLoadingMore
} = useNews();
```

## 🧪 Testing

### Development Commands

```bash
# Lint code
npm run lint

# Type checking
npx tsc --noEmit

# Build verification
npm run build
npm run preview
```

### Testing Strategy

**Recommended Testing Approach**
- Unit tests with Jest + React Testing Library
- Integration tests for API calls
- E2E tests with Playwright/Cypress
- Component testing with Storybook

## 📦 Deployment

### Build Process

```bash
# Production build
npm run build

# Build output in dist/ directory
# Optimized and minified assets
# TypeScript compilation
```

### Deployment Options

**Static Hosting**
- Vercel (recommended)
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

**Configuration Example (Vercel)**
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ]
}
```

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Make changes following TypeScript best practices
3. Test thoroughly
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Follow configured rules
- **Component Structure**: Functional components with hooks
- **State Management**: Redux Toolkit patterns
- **CSS**: Component-scoped styling
- **API**: RTK Query for all API calls

## 🔍 Troubleshooting

### Common Issues

**Build Errors**
- Ensure TypeScript strict mode compliance
- Check import paths and case sensitivity
- Verify environment variables

**API Connection Issues**
- Verify `VITE_API_BASE_URL` in `.env`
- Check backend server status
- Inspect network requests in DevTools

**Authentication Problems**
- Clear localStorage/sessionStorage
- Check JWT token expiry
- Verify API endpoints

### Performance Optimization

**Recommended Practices**
- Implement React.memo for expensive components
- Use RTK Query for efficient data caching
- Optimize bundle size with code splitting
- Implement virtual scrolling for large lists

## 📚 Additional Resources

### Documentation
- [React 19 Documentation](https://react.dev)
- [Redux Toolkit Guide](https://redux-toolkit.js.org)
- [React Router v7](https://reactrouter.com)
- [Material-UI Documentation](https://mui.com)

### Related Projects
- [Smart News Backend](../backend) - Python FastAPI ML pipeline
- [Smart News ML Models](../ml-models) - Article recommendation models

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Development Team

- **Frontend**: React TypeScript with Redux Toolkit
- **Backend**: Python FastAPI with ML Pipeline
- **Database**: PostgreSQL with Vector Search
- **ML**: Sentence Transformers + Neural Reranking

---

**Happy Coding! 🚀**

For questions or support, please open an issue in this repository.