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

const RECIPES = [
  { code: 'B-01 / CORE', name: 'SMASH CLASSIC', description: 'Doppio smash di manzo, cheddar fuso, cipolla, cetriolini e salsa della casa.', price: 10.50 },
  { code: 'B-02 / HEAT', name: 'HOT SIGNAL', description: 'Manzo alla piastra, jalapeño, cheddar, cipolla croccante e salsa habanero.', price: 11.50 },
  { code: 'B-03 / GREEN', name: 'GREEN MACHINE', description: 'Patty vegetale, lattuga, cipolla, pomodoro e maionese al lime.', price: 9.50 },
  { code: 'B-04 / BIRD', name: 'CRISPY BIRD', description: 'Pollo fritto, cavolo marinato, lattuga e maionese affumicata.', price: 10.00 }
];

export function OrderStoreProvider({ children }) {
  // The buffer is available before checkout; cart operations sync it with the backend.
  const [items, setItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState(RECIPES);
  const [selectedRecipe, setSelectedRecipe] = useState(RECIPES[0]);
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
    setRecipes(nextRecipes);
    setSelectedRecipe(nextRecipes[0]);
    setActiveRecipeIndex(0);
  }, []);

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