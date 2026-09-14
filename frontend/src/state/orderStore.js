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
  // The buffer is available before checkout; cart operations sync it with the backend.
  const [items, setItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);

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

  const selectRecipe = useCallback((index, recipe) => {
    setActiveRecipeIndex(index);
    setSelectedRecipe(recipe);
    setQuantity(1);
  }, []);

  const replaceRecipes = useCallback((nextRecipes) => {
    const availableRecipes = nextRecipes || [];
    setRecipes(availableRecipes);
    setSelectedRecipe(availableRecipes[0] || null);
    setActiveRecipeIndex(0);
  }, []);

  const selectRestaurant = useCallback((restaurant) => {
    const currentId = selectedRestaurant?.id || selectedRestaurant?._id;
    const nextId = restaurant?.id || restaurant?._id;
    if (currentId && nextId && currentId !== nextId && items.length > 0) {
      return false;
    }
    setSelectedRestaurant(restaurant);
    return true;
  }, [items, selectedRestaurant]);

  const addToBuffer = useCallback(() => {
    addItem({ ...selectedRecipe, quantity });
  }, [addItem, quantity, selectedRecipe]);

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
    } catch (error) {
      if (error.status === 404) {
        setItems([]);
        return null;
      }
      throw error;
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

  /**
  * Confirm the draft cart: the server computes totals and creates the order.
  * mode: 'pickup' | 'delivery'; delivery: { address } quando mode e' delivery.
  */
  const confirmCart = useCallback(async (mode, delivery) => {
    setLoading(true);
    try {
      const response = await orderService.confirmCart(mode, delivery);
      if (response.success) {
        setCurrentOrder(response.data);
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
    selectedRecipe,
    quantity,
    setQuantity,
    activeRecipeIndex,
    recipes,
    selectedRestaurant,
    selectRestaurant,
    setRecipes: replaceRecipes,
    orderHistory,
    currentOrder,
    loading,
    // local buffer
    addItem,
    selectRecipe,
    addToBuffer,
    removeItem,
    clearItems,
    clearBuffer: clearItems,
    // backend cart
    fetchCart,
    addCartItem,
    updateCartItem,
    removeCartItem,
    clearCart,
    confirmCart,
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