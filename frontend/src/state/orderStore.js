/**
 * Order Store
 * Cart state, current order, order history
 * Immutable updates throughout
 */

import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import { html } from '../utils/htm.js';
import { orderService } from '../services/orderService.js';

export const OrderContext = createContext(null);

export function OrderStoreProvider({ children }) {
  // Local buffer (prototype behaviour). Synced with backend cart when authenticated.
  const [items, setItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const addItem = useCallback((item) => {
    setItems((prev) => [
      ...prev,
      { ...item, quantity: item.quantity || 1 }
    ]);
  }, []);

  const removeItem = useCallback((index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
  }, []);

  // --- Backend cart operations ---

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orderService.getCart();
      if (response.success) {
        setItems(response.data.items || []);
        return response.data;
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCartItem = useCallback(async (restaurantId, dishId, quantity) => {
    setLoading(true);
    try {
      const response = await orderService.addToCart(restaurantId, dishId, quantity);
      if (response.success) {
        setItems(response.data.items || []);
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCartItem = useCallback(async (dishId, quantity) => {
    setLoading(true);
    try {
      const response = await orderService.updateCartItem(dishId, quantity);
      if (response.success) {
        setItems(response.data.items || []);
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCartItem = useCallback(async (dishId) => {
    setLoading(true);
    try {
      const response = await orderService.removeFromCart(dishId);
      if (response.success) {
        setItems(response.data.items || []);
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await orderService.deleteCart();
      if (response.success) {
        setItems([]);
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Orders ---

  const fetchOrderHistory = useCallback(async (status) => {
    setLoading(true);
    try {
      const response = await orderService.getUserOrders(status);
      if (response.success) {
        setOrderHistory(response.data || []);
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrder = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await orderService.getOrder(id);
      if (response.success) {
        setCurrentOrder(response.data);
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    try {
      const response = await orderService.createOrder(orderData);
      if (response.success) {
        setCurrentOrder(response.data);
        setItems([]);
      }
      return response;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmDelivery = useCallback(async (id) => {
    const response = await orderService.confirmDelivery(id);
    if (response.success) {
      setCurrentOrder(response.data);
    }
    return response;
  }, []);

  const value = {
    items,
    orderHistory,
    currentOrder,
    loading,
    // local buffer
    addItem,
    removeItem,
    clearItems,
    // backend cart
    fetchCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    // orders
    fetchOrderHistory,
    fetchOrder,
    createOrder,
    confirmDelivery
  };

  return html`<${OrderContext.Provider} value=${value}>${children}<//>`;
}

export function useOrderStore() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderStore must be used within OrderStoreProvider');
  }
  return context;
}