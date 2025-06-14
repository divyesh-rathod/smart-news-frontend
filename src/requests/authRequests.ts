import axios from 'axios';
import {type  LoginFormData, type SignupFormData }  from '../schemas/authSchemas';
import   {type AuthResponse, } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/V1'; // ✅ From env

// Create axios instance with base configuration
const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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