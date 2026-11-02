import axios from 'axios';

// Use relative path — Vite dev server proxy forwards /api to Flask backend on port 5000
// See vite.config.js proxy settings
const API_BASE_URL = '/api';


// Create a pre-configured Axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request Interceptor: Attach JWT token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('suraksha_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling and automatic logout on 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 (Unauthorized)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const isLoginRequest = originalRequest.url?.includes('/auth/login');
      if (!isLoginRequest) {
        // Clear credentials from storage
        localStorage.removeItem('suraksha_token');
        localStorage.removeItem('suraksha_user');
        
        // Force reload or redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
