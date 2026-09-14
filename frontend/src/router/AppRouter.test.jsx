/* verifica che l'admin non resti sulla home: al login e a ogni visita di una
   rotta non sua, il router lo riporta sulla dashboard. le regole pure vivono in
   domain/roles.js, qui si controlla che il router le applichi. */

import { render, waitFor } from '@testing-library/preact';
import { AppRouter } from './AppRouter.jsx';
import { navigate } from './navigate.js';
import { setupService } from '../services/setupService.js';

const { auth } = vi.hoisted(() => ({ auth: { user: null, isAuthenticated: false, loading: false } }));

vi.mock('../state/authStore.js', () => ({ useAuthStore: () => auth }));
vi.mock('./navigate.js', () => ({ navigate: vi.fn() }));
vi.mock('../services/setupService.js', () => ({ setupService: { getStatus: vi.fn() } }));

describe('AppRouter - atterraggio dell admin', () => {
  beforeEach(() => {
    navigate.mockClear();
    setupService.getStatus.mockResolvedValue({ success: true, data: { adminExists: true, setupCompleted: true } });
    window.history.pushState({}, '', '/');
    auth.user = { role: 'admin' };
    auth.isAuthenticated = true;
  });

  test('riporta l admin dalla home alla sua dashboard', async () => {
    render(<AppRouter />);

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/dashboard/admin'));
  });
});
