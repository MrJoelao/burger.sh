/* verifica che l'admin non resti sulla home: al login e a ogni visita di una
   rotta non sua, il router lo riporta sulla dashboard. le regole pure vivono in
   domain/roles.js, qui si controlla che il router le applichi. */

import { render, screen, waitFor } from '@testing-library/preact';
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

  test('mostra una schermata autonoma quando una rotta protetta richiede il login', async () => {
    auth.user = null;
    auth.isAuthenticated = false;
    window.history.pushState({}, '', '/orders/payment');

    render(<AppRouter />);

    expect(await screen.findByText(/ACCEDI_PER PROCEDERE/i)).toBeInTheDocument();
    expect(screen.queryByText('nuovo ordine')).toBeNull();
    expect(screen.queryByText(/buffer empty/i)).toBeNull();
    expect(document.querySelector('.command-list')).toBeNull();
  });

  test('mostra la schermata 404 per un percorso sconosciuto', async () => {
    auth.user = null;
    auth.isAuthenticated = false;
    window.history.pushState({}, '', '/profilesds');

    render(<AppRouter />);

    expect(await screen.findByText('VOID', { selector: 'h1' })).toBeInTheDocument();
    expect(document.querySelector('main.error-fullscreen[data-error-kind="not-found"]')).not.toBeNull();
  });
});
