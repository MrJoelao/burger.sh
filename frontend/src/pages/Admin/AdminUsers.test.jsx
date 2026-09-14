import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { AdminUsers } from './AdminUsers.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { role: 'admin', name: 'root' }, logout: vi.fn() })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/managerAdminService.js', () => ({
  managerAdminService: { getStats: vi.fn(), getAllUsers: vi.fn(), updateUser: vi.fn(), deleteUser: vi.fn() }
}));

describe('AdminUsers', () => {
  test('ricarica con la query del filtro scelto', async () => {
    managerAdminService.getAllUsers.mockResolvedValue({ success: true, data: [] });

    render(<AdminUsers />);
    await screen.findByText(/nessun utente/i);

    fireEvent.change(screen.getByLabelText('ruolo'), { target: { value: 'manager' } });
    fireEvent.change(screen.getByLabelText('stato manager'), { target: { value: 'pending' } });

    await waitFor(() => {
      expect(managerAdminService.getAllUsers).toHaveBeenLastCalledWith({ role: 'manager', managerStatus: 'pending' });
    });
  });

  test('approva un manager dalla lista', async () => {
    managerAdminService.getAllUsers.mockResolvedValue({
      success: true,
      data: [{ _id: 'm1', name: 'Ada', surname: 'L', email: 'ada@x.it', role: 'manager', managerStatus: 'pending' }]
    });
    managerAdminService.updateUser.mockResolvedValue({ success: true });

    render(<AdminUsers />);
    fireEvent.click(await screen.findByRole('button', { name: /approva/i }));

    await waitFor(() => {
      expect(managerAdminService.updateUser).toHaveBeenCalledWith('m1', { managerStatus: 'approved' });
    });
  });

  test('elimina un utente solo dopo la conferma', async () => {
    managerAdminService.getAllUsers.mockResolvedValue({
      success: true,
      data: [{ _id: 'c1', name: 'Luca', surname: 'B', email: 'luca@x.it', role: 'customer' }]
    });
    managerAdminService.deleteUser.mockResolvedValue({ success: true });

    render(<AdminUsers />);
    fireEvent.click(await screen.findByRole('button', { name: /elimina/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => expect(managerAdminService.deleteUser).toHaveBeenCalledWith('c1'));
  });
});
