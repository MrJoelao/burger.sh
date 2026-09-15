/**
 * Payment Service
 * metodi di pagamento salvati dal cliente. il progetto non addebita nulla: i
 * metodi si registrano e basta, il pagamento alla cassa o alla consegna resta
 * una simulazione. `details` per una carta sono solo le ultime 4 cifre.
 */

import { api } from './api.js';

export const paymentService = {
  /**
   * GET /users/me/payment-methods
   */
  async list() {
    return api.get('/users/me/payment-methods');
  },

  /**
   * GET /users/me/payment-methods/{id}
   */
  async get(id) {
    return api.get(`/users/me/payment-methods/${id}`);
  },

  /**
   * POST /users/me/payment-methods
   */
  async create(payload) {
    return api.post('/users/me/payment-methods', payload);
  },

  /**
   * PUT /users/me/payment-methods/{id}
   */
  async update(id, payload) {
    return api.put(`/users/me/payment-methods/${id}`, payload);
  },

  /**
   * DELETE /users/me/payment-methods/{id}
   */
  async remove(id) {
    return api.delete(`/users/me/payment-methods/${id}`);
  }
};

export default paymentService;
