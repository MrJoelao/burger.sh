import { api } from './api.js';

export const setupService = {
  getStatus: () => api.get('/setup/status'),
  requestPin: () => api.post('/setup/request-pin', {}),
  executeSetup: (data) => api.post('/setup', data),
  changePassword: (currentPassword, newPassword) => api.post('/setup/change-password', { currentPassword, newPassword })
};

export default setupService;
