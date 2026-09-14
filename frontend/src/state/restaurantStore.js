/**
 * Restaurant Store
 * Current restaurant, menu/dishes, search filters
 */

import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import { html } from '../utils/htm.js';
import { restaurantService } from '../services/restaurantService.js';

export const RestaurantContext = createContext(null);

const emptyFilters = Object.freeze({ name: '', city: '', dishName: '' });

export function RestaurantStoreProvider({ children }) {
  const [restaurants, setRestaurants] = useState([]);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRestaurants = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const response = await restaurantService.getRestaurants({
        page,
        limit: pagination.limit,
        ...filters
      });

      if (response.success) {
        setRestaurants(response.data || []);
        setPagination((prev) => ({
          ...prev,
          page,
          total: response.pagination?.total ?? 0,
          totalPages: response.pagination?.totalPages ?? 0
        }));
      }
      return response;
    } catch (err) {
      setError(err.message);
      setRestaurants([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  const fetchRestaurant = useCallback(async (id) => {
    setLoading(true);
    setError('');
    try {
      const response = await restaurantService.getRestaurant(id);
      if (response.success) {
        setCurrentRestaurant(response.data);
      }
      return response;
    } catch (err) {
      setError(err.message);
      setCurrentRestaurant(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMenu = useCallback(async (restaurantId) => {
    setLoading(true);
    setError('');
    try {
      const response = await restaurantService.getDishesByRestaurant(restaurantId);
      if (response.success) {
        setMenu(response.data || []);
      }
      return response;
    } catch (err) {
      setError(err.message);
      setMenu([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(emptyFilters);
  }, []);

  const value = {
    restaurants,
    currentRestaurant,
    menu,
    filters,
    pagination,
    loading,
    error,
    fetchRestaurants,
    fetchRestaurant,
    fetchMenu,
    setFilter,
    clearFilters
  };

  return html`<${RestaurantContext.Provider} value=${value}>${children}<//>`;
}

export function useRestaurantStore() {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurantStore must be used within RestaurantStoreProvider');
  }
  return context;
}