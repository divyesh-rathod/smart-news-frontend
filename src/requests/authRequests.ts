import axios from 'axios';
import type { LoginFormData, SignupFormData } from '../schemas/authSchemas';

const API_BASE_URL = 'http://localhost:8080/api/V1';

// Create axios instance with base configuration
    // This instance can be used to make authenticated requests to the API
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const authRequests = {
  login: async (data: LoginFormData): Promise<AuthResponse> => {
    try {
      const response = await authAPI.post<AuthResponse>('/auth/login', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.detail || 'Login failed');
      }
      throw new Error('Network error. Please try again.');
    }
  },

  signup: async (data: SignupFormData): Promise<AuthResponse> => {
    try {
      const response = await authAPI.post<AuthResponse>('/auth/signup', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.detail || 'Signup failed');
      }
      throw new Error('Network error. Please try again.');
    }
  },
};