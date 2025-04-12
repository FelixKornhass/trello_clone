/**
 * Router Configuration
 * 
 * This module configures the Vue Router for the application, defining routes
 * and navigation guards for authentication.
 */

import { createRouter, createWebHistory } from 'vue-router';
import store from '@/store';

// Define application routes
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true } // Only accessible to non-authenticated users
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresGuest: true } // Only accessible to non-authenticated users
  },
  {
    path: '/boards',
    name: 'Boards',
    component: () => import('@/views/Boards.vue'),
    meta: { requiresAuth: true } // Only accessible to authenticated users
  },
  {
    path: '/board/:id',
    name: 'Board',
    component: () => import('@/views/Board.vue'),
    meta: { requiresAuth: true } // Only accessible to authenticated users
  },
  {
    path: '/',
    redirect: '/boards' // Redirect root path to boards page
  }
];

// Create router instance with HTML5 history mode
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard to handle authentication
router.beforeEach((to, from, next) => {
  // Check if user is authenticated
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // If token exists but isAuthenticated is false, update the store
  if (token && user && !isAuthenticated) {
    console.log('Token exists but isAuthenticated is false, updating store');
    store.commit('auth/SET_USER', user);
    store.commit('auth/SET_TOKEN', token);
    
    // Ensure userId is set in localStorage
    if (user.id && !localStorage.getItem('userId')) {
      localStorage.setItem('userId', user.id);
    }
    
    // Ensure boardsTitle is set in localStorage
    if (user.boardsTitle && !localStorage.getItem('boardsTitle')) {
      localStorage.setItem('boardsTitle', user.boardsTitle);
    }
  }

  // Redirect to login if route requires auth and user is not authenticated
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('Route requires auth but user is not authenticated, redirecting to login');
    next('/login');
  } 
  // Redirect to boards if route requires guest and user is authenticated
  else if (to.meta.requiresGuest && isAuthenticated) {
    console.log('Route requires guest but user is authenticated, redirecting to boards');
    next('/boards');
  } 
  // Otherwise, proceed with navigation
  else {
    console.log('Proceeding with navigation to:', to.path);
    next();
  }
});

export default router;
