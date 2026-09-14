/**
 * Core API Service
 * fetchWithAuth wrapper with token management, error handling, retry logic
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken || localStorage.getItem('auth_token');
}

export function clearAuthToken() {
  authToken = null;
  localStorage.removeItem('auth_token');
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * fetchWithAuth - Wrapper around fetch with automatic token attachment
 * and comprehensive error handling
 */
export async function fetchWithAuth(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle 401 - unauthorized (expired token)
    if (response.status === 401) {
      clearAuthToken();
      window.location.href = '/auth';
      throw new ApiError('Session expired. Please login again.', 401);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        data.message || data.detail || `Request failed with status ${response.status}`,
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    // Network error with retry logic
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new ApiError('Network error. Please check your connection.', 0);
    }

    throw error;
  }
}

/**
 * fetchWithRetry - Retry wrapper for network errors
 */
export async function fetchWithRetry(endpoint, options = {}, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithAuth(endpoint, options);
    } catch (error) {
      if (attempt === retries) throw error;
      if (error.status === 0) {
        // Only retry on network errors
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
}

/**
 * HTTP method helpers
 */
export const api = {
  get: (endpoint, options = {}) =>
    fetchWithRetry(endpoint, { ...options, method: 'GET' }),

  post: (endpoint, data, options = {}) =>
    fetchWithRetry(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    }),

  put: (endpoint, data, options = {}) =>
    fetchWithRetry(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  patch: (endpoint, data, options = {}) =>
    fetchWithRetry(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  delete: (endpoint, options = {}) =>
    fetchWithRetry(endpoint, { ...options, method: 'DELETE' })
};

export { ApiError };
export default api;