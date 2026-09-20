/**
 * UI Store
 * Toast notifications, loading states, modals
 */

import { createContext } from 'preact';
import { useContext, useState, useCallback } from 'preact/hooks';
import { html } from '../utils/htm.js';

export const UIContext = createContext(null);

export function UIStoreProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, duration = 1700) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Simple modal state (single modal at a time)
  const [modal, setModal] = useState(null);

  const openModal = useCallback((name, props = {}) => {
    setModal({ name, props });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const value = {
    toasts,
    showToast,
    dismissToast,
    modal,
    openModal,
    closeModal
  };

  return html`<${UIContext.Provider} value=${value}>${children}<//>`;
}

export function useUIStore() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUIStore must be used within UIStoreProvider');
  }
  return context;
}