/**
 * Order Service
 * Handles cart management, order creation, and order tracking
 */

import { api } from './api.js';

export const orderService = {
  // --- Cart operations ---

  /**
   * Get current cart (draft order)
   * GET /cart
   */
  async getCart() {
    return api.get('/cart');
  },

  /**
   * Add item to cart
   * POST /cart/items
   */
  async addToCart(restaurantId, dishId, quantity = 1) {
    return api.post('/cart/items', { restaurantId, dishId, quantity });
  },

  /**
   * Update cart item quantity
   * PATCH /cart/items/{dishId}
   */
  async updateCartItem(dishId, quantity) {
    return api.patch(`/cart/items/${dishId}`, { quantity });
  },

  /**
   * Remove item from cart
   * DELETE /cart/items/{dishId}
   */
  async removeFromCart(dishId) {
    return api.delete(`/cart/items/${dishId}`);
  },

  /**
  * Delete entire cart
  * DELETE /cart
  */
  async deleteCart() {
    return api.delete('/cart');
  },

  /**
  * Confirm cart: turns the draft cart into a real order
  * POST /cart/confirm
  */
  async confirmCart(mode, delivery) {
    return api.post('/cart/confirm', { mode, ...(delivery && { delivery }) });
  },

  // --- Order operations ---

  /**
   * Create direct order (without cart)
   * POST /orders
   */
  async createOrder(orderData) {
    return api.post('/orders', orderData);
  },

  /**
   * Get user's orders with optional status filter
   * GET /orders/user
   */
  async getUserOrders(status) {
    const query = status ? `?status=${status}` : '';
    return api.get(`/orders/user${query}`);
  },

  /**
   * Get single order detail
   * GET /orders/{id}
   */
  async getOrder(id) {
    return api.get(`/orders/${id}`);
  },

  /**
   * Confirm delivery received
   * PATCH /orders/{id}/confirm-delivery
   */
  async confirmDelivery(id) {
    return api.patch(`/orders/${id}/confirm-delivery`);
  }
};

export default orderService;