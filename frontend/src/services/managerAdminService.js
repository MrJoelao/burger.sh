/**
 * Manager/Admin Service
 * Handles restaurant order management and admin operations
 */

import { api } from './api.js';

export const managerAdminService = {
  // --- Manager operations ---

  /**
   * Get orders for a restaurant
   * GET /orders/restaurant/{id}
   */
  async getRestaurantOrders(restaurantId, status) {
    const query = status ? `?status=${status}` : '';
    return api.get(`/orders/restaurant/${restaurantId}${query}`);
  },

  /**
   * Get restaurant dashboard stats
   * GET /orders/restaurant/{id}/dashboard
   */
  async getDashboard(restaurantId) {
    return api.get(`/orders/restaurant/${restaurantId}/dashboard`);
  },

  /**
   * Update order status (manager)
   * PATCH /orders/{id}/status
   */
  async updateOrderStatus(id, status) {
    return api.patch(`/orders/${id}/status`, { status });
  },

  // --- Admin operations ---

  /**
   * Get all users with optional filters
   * GET /admin/users
   */
  async getAllUsers(params = {}) {
    const query = buildQuery(params);
    return api.get(`/admin/users${query}`);
  },

  /**
   * Get one user by id
   * GET /admin/users/{id}
   */
  async getUser(id) {
    return api.get(`/admin/users/${id}`);
  },

  /**
   * Update user (e.g., approve manager)
   * PATCH /admin/users/{id}
   */
  async updateUser(id, data) {
    return api.patch(`/admin/users/${id}`, data);
  },

  /**
   * Delete a user, optionally transferring owned branches
   * DELETE /admin/users/{id}
   */
  async deleteUser(id, options = {}) {
    const config = {};
    if (options.newManagerId) {
      config.body = JSON.stringify({ newManagerId: options.newManagerId });
    }
    return api.delete(`/admin/users/${id}`, config);
  },

  /**
   * Get system stats
   * GET /admin/stats
   */
  async getStats() {
    return api.get('/admin/stats');
  }
};

function buildQuery(params) {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '');

  if (filtered.length === 0) return '';

  return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
}

export default managerAdminService;