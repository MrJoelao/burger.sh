/**
 * Auth Store
 * Global auth state: user session, token, role, managerStatus
 * Built on Preact signals-free pattern with ImmutableContext updates
 */

import { createContext } from 'preact';
import { useContext, useState, useEffect, useCallback } from 'preact/hooks';
import { html } from '../utils/htm.js';
import { authService } from '../services/authService.js';

export const AuthContext = createContext(null);

export function AuthStoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      if (!authService.isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getProfile();
        if (cancelled) return;

        if (response.success) {
          setUser(response.data);
        } else {
          authService.logout();
          setToken(null);
        }
      } catch (_err) {
        if (!cancelled) {
          authService.logout();
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    if (result.success) {
      setToken(result.data.token);
      setUser(result.data.user || null);
    }
    return result;
  }, []);

  const register = useCallback(async (userData) => {
    const result = await authService.register(userData);
    if (result.success) {
      setToken(result.data.token);
      setUser(result.data.user || null);
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const response = await authService.updateProfile(data);
    if (response.success) {
      setUser(response.data);
    }
    return response;
  }, []);

  /* elimina l'account dell'utente autenticato. a differenza del token scaduto,
     qui la sessione finisce perché l'utente non esiste più: svuoto lo stato
     locale solo quando il backend conferma la cancellazione. */
  const deleteAccount = useCallback(async (options = {}) => {
    const response = await authService.deleteAccount(options);
    if (response.success) {
      authService.logout();
      setUser(null);
      setToken(null);
    }
    return response;
  }, []);

  /* chiude il cambio password forzato: ricarica l'utente da /users/me per
     leggere il flag aggiornato lato server. se il refresh fallisce subito dopo
     il cambio, il backend ha comunque già azzerato mustChangePassword, quindi
     sblocco l'utente in memoria per non lasciarlo nel redirect forzato. */
  const completePasswordChange = useCallback(async () => {
    try {
      const response = await authService.getProfile();
      if (response.success) {
        setUser(response.data);
        return;
      }
    } catch (_error) {
      /* ricaduta gestita sotto */
    }

    setUser(previous => (previous ? { ...previous, mustChangePassword: false } : previous));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isCustomer: user?.role === 'customer',
    managerStatus: user?.managerStatus || null,
    login,
    register,
    logout,
    updateProfile,
    deleteAccount,
    completePasswordChange
  };

  return html`<${AuthContext.Provider} value=${value}>${children}<//>`;
}

export function useAuthStore() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthStore must be used within AuthStoreProvider');
  }
  return context;
}