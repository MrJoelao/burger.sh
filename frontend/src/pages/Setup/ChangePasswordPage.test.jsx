/* la pagina di cambio password forzato appartiene al flusso di setup, quindi
   usa lo stesso guscio, ma non deve riprodurre la sequenza di boot: quella
   spetta solo al primissimo avvio. dopo il cambio deve sbloccare la sessione
   e portare l'admin sulla sua dashboard, non riportarlo qui. */

import { render, screen, fireEvent } from '@testing-library/preact';
import { ChangePasswordPage } from './ChangePasswordPage.jsx';
import { setupService } from '../../services/setupService.js';
import { navigate } from '../../router/navigate.js';

const { completePasswordChange } = vi.hoisted(() => ({ completePasswordChange: vi.fn() }));

vi.mock('../../services/setupService.js', () => ({
  setupService: {
    requestPin: vi.fn(),
    executeSetup: vi.fn(),
    getStatus: vi.fn(),
    changePassword: vi.fn()
  }
}));

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({
    user: { role: 'admin' },
    completePasswordChange
  })
}));

vi.mock('../../router/navigate.js', () => ({
  navigate: vi.fn()
}));

describe('ChangePasswordPage', () => {
  test('vive nel guscio setup senza la sequenza di boot', () => {
    const { container } = render(<ChangePasswordPage />);

    expect(container.querySelector('main.setup-console')).not.toBeNull();
    expect(container.querySelector('.setup-boot')).toBeNull();
  });

  test('invia password attuale e nuova al servizio', () => {
    setupService.changePassword.mockResolvedValue({ success: true, data: {} });
    const { container } = render(<ChangePasswordPage />);

    fireEvent.input(screen.getByLabelText('password attuale'), { target: { value: 'provvisoria' } });
    fireEvent.input(screen.getByLabelText('nuova password'), { target: { value: 'nuovaPassword1' } });
    fireEvent.input(screen.getByLabelText('conferma nuova password'), { target: { value: 'nuovaPassword1' } });
    fireEvent.submit(container.querySelector('form'));

    expect(setupService.changePassword).toHaveBeenCalledWith('provvisoria', 'nuovaPassword1');
  });

  test('dopo il cambio sblocca la sessione e va sulla dashboard admin', async () => {
    setupService.changePassword.mockResolvedValue({ success: true, data: {} });
    const { container } = render(<ChangePasswordPage />);

    fireEvent.input(screen.getByLabelText('password attuale'), { target: { value: 'provvisoria' } });
    fireEvent.input(screen.getByLabelText('nuova password'), { target: { value: 'nuovaPassword1' } });
    fireEvent.input(screen.getByLabelText('conferma nuova password'), { target: { value: 'nuovaPassword1' } });
    fireEvent.submit(container.querySelector('form'));

    await vi.waitFor(() => {
      expect(completePasswordChange).toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith('/dashboard/admin');
    });
  });
});
