import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors, e.g., 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we receive a 401 error, we could automatically log the user out 
    // by removing the token and redirecting to login, but we'll let AuthContext 
    // handle the redirection mostly. We will just clear the local storage here.
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login'; // Optional: force redirect here
    }
    return Promise.reject(error);
  }
);

export default api;
