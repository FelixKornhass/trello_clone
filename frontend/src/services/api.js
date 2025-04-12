/**
 * API Service Module
 * 
 * This module provides a centralized API client for making HTTP requests to the backend.
 * It uses axios for HTTP requests and includes interceptors for authentication and error handling.
 */

import axios from 'axios';

// Base URL for API requests
const API_URL = 'http://localhost:5000/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add authentication token to all requests
api.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    // If token exists, add it to the Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common error scenarios
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Response interceptor error:', error);
    // If unauthorized (401), clear token and redirect to login
    if (error.response?.status === 401) {
      console.log('Unauthorized access, clearing token and redirecting to login');
      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('boardsTitle');
      
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API endpoints
export const auth = {
  // Register a new user
  register: (userData) => api.post('/auth/register', userData),
  // Login with credentials
  login: (credentials) => api.post('/auth/login', credentials)
};

// Boards API endpoints
export const boards = {
  // Get all boards
  getAll: () => api.get('/boards'),
  // Get a single board by ID
  getOne: (id) => api.get(`/boards/${id}`),
  // Create a new board
  create: (boardData) => api.post('/boards', boardData),
  // Update an existing board
  update: (id, boardData) => api.put(`/boards/${id}`, boardData),
  // Delete a board
  delete: (id) => api.delete(`/boards/${id}`)
};

// Export the configured axios instance as default
export default api; 