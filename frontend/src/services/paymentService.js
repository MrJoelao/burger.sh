/**
 * Payment Service
 * Handles payment method CRUD for authenticated customers
 */

import { api } from './api.js';

export const paymentService = {
  /**
   * Get user's payment methods
   * GET /users/me/payment-methods
   */
  async getPaymentMethods() {
    return api.get('/users/me/payment-methods');
  },

  /**
   * Add a new payment method
   * POST /users/me/payment-methods
   */
  async addPaymentMethod(data) {
    return api.post('/users/me/payment-methods', data);
  },

  /**
   * Update a payment method
   * PUT /users/me/payment-methods/{id}
   */
  async updatePaymentMethod(id, data) {
    return api.put(`/users/me/payment-methods/${id}`, data);
  },

  /**
   * Delete a payment method
   * DELETE /users/me/payment-methods/{id}
   */
  async deletePaymentMethod(id) {
    return api.delete(`/users/me/payment-methods/${id}`);
  }
};

export default paymentService;