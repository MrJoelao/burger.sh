/**
 * Restaurant Service
 * Handles restaurant listing, detail, and dish queries
 */

import { api } from './api.js';

export const restaurantService = {
  /**
   * Get paginated restaurant list with filters
   * GET /restaurants
   */
  async getRestaurants(params = {}) {
    const query = buildQuery(params);
    return api.get(`/restaurants${query}`);
  },

  /**
   * Get restaurant detail by ID
   * GET /restaurants/{id}
   */
  async getRestaurant(id) {
    return api.get(`/restaurants/${id}`);
  },

  /**
   * Get dishes for a specific restaurant
   * GET /dishes/restaurant/{restaurantId}
   */
  async getDishesByRestaurant(restaurantId) {
    return api.get(`/dishes/restaurant/${restaurantId}`);
  },

  /**
   * Create restaurant (admin only)
   * POST /restaurants
   */
  async createRestaurant(data) {
    return api.post('/restaurants', data);
  },

  /**
   * Update restaurant (admin or manager)
   * PUT /restaurants/{id}
   */
  async updateRestaurant(id, data) {
    return api.put(`/restaurants/${id}`, data);
  },

  /**
   * Delete or transfer restaurant (admin or manager)
   * DELETE /restaurants/{id}
   */
  async deleteRestaurant(id, options = {}) {
    const config = {};
    if (options.newManagerId) {
      config.body = JSON.stringify({ newManagerId: options.newManagerId });
    }
    return api.delete(`/restaurants/${id}`, config);
  }
};

function buildQuery(params) {
  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '');

  if (filtered.length === 0) return '';

  return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
}

export default restaurantService;