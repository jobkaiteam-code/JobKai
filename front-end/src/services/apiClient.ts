import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { auth } from '@/firebase/config';

// API Base URL - Always use the API Gateway
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for ML-heavy operations like Job Matcher
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor - Add Firebase ID token if available
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Get Firebase ID token from current user
      const user = auth.currentUser;
      
      if (user) {
        // Get fresh token (will use cached token if not expired)
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Fallback: Try to get token from sessionStorage (set during login)
        const token = sessionStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Failed to get Firebase token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle errors globally and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const user = auth.currentUser;
        
        if (user) {
          // Force refresh the Firebase ID token
          const newToken = await user.getIdToken(true);
          sessionStorage.setItem('authToken', newToken);
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } else {
          // No user logged in, redirect to login
          console.error('Unauthorized - please login again');
          window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const message = (error.response.data as any)?.detail || 
                      (error.response.data as any)?.message || 
                      error.message;

      switch (status) {
        case 401:
          console.error('Unauthorized - please login again');
          break;
        case 403:
          console.error('Forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found:', message);
          break;
        case 429:
          console.error('Rate limit exceeded:', message);
          break;
        case 500:
          console.error('Server error:', message);
          break;
        case 503:
          console.error('Service unavailable:', message);
          break;
        default:
          console.error(`API Error (${status}):`, message);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - no response from server:', error.message);
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper function to create FormData for file uploads
export const createFormData = (
  file: File, 
  additionalFields?: Record<string, string>,
  fileFieldName: string = 'file'
): FormData => {
  const formData = new FormData();
  formData.append(fileFieldName, file);
  
  if (additionalFields) {
    Object.entries(additionalFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }
  
  return formData;
};

// Helper function to download file from blob
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default apiClient;
