import axios from 'axios';
import { logout } from '../AuthHelpers';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token from localStorage if available
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    // Handle authentication errors
    if (response && response.status === 401) {
      // Don't logout if it's the "no role assigned" case
      if (response.data?.message !== 'User has not been assigned a role') {
        logout();
      }
    }
    
    return Promise.reject(error);
  }
);