/**
 * System Service
 * Stato di salute del backend, usato dalla home e dalla console di debug.
 */

import { api } from './api.js';

export const systemService = {
  /**
   * Backend health probe
   * GET /health
   */
  async health() {
    return api.get('/health');
  }
};

export default systemService;
