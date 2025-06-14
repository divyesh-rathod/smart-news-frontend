export interface User {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    profile_picture?: string;
    is_blocked: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export interface AuthResponse {
    user: User;
    access_token: string;
    token_type: string;
  }
  
  // Additional auth-related types
  export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface SignupCredentials {
    name: string;
    email: string;
    phone_number: string;
    password: string;
    profile_picture?: string;
  }
  
  // API Error types
  export interface APIError {
    detail: string;
    status: number;
  }