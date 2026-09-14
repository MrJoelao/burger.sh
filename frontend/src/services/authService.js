/**
 * Auth Service
 * Handles authentication, registration, profile management
 */

import { api, setAuthToken, clearAuthToken } from './api.js';

export const authService = {
  /**
   * Login user
   * POST /auth/login
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });

    if (response.success) {
      setAuthToken(response.data.token);
      localStorage.setItem('auth_token', response.data.token);
      return { success: true, data: response.data };
    }

    return { success: false, message: response.message };
  },

  /**
   * Register new user (customer or manager)
   * POST /auth/register
   */
  async register(userData) {
    const response = await api.post('/auth/register', userData);

    if (response.success) {
      setAuthToken(response.data.token);
      localStorage.setItem('auth_token', response.data.token);
      return { success: true, data: response.data };
    }

    return { success: false, message: response.message };
  },

  /**
   * Get current user profile
   * GET /users/me
   */
  async getProfile() {
    return api.get('/users/me');
  },

  /**
   * Update current user profile
   * PUT /users/me
   */
  async updateProfile(data) {
    return api.put('/users/me', data);
  },

  /**
   * Delete current user account
   * DELETE /users/me
   */
  async deleteAccount(reason) {
    return api.delete('/users/me', {
      body: reason ? JSON.stringify({ reason }) : undefined
    });
  },

  /**
   * Logout - clear token and state
   */
  logout() {
    clearAuthToken();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem('auth_token');
  }
};

export default authService;