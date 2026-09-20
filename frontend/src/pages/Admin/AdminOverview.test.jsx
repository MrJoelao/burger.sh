import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { AdminOverview } from './AdminOverview.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';

const { logout } = vi.hoisted(() => ({ logout: vi.fn() }));

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { role: 'admin', name: 'root' }, logout })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/managerAdminService.js', () => ({
  managerAdminService: { getStats: vi.fn(), getAllUsers: vi.fn(), updateUser: vi.fn() }
}));

vi.mock('../../services/systemService.js', () => ({ systemService: { health: vi.fn() } }));
vi.mock('../../services/setupService.js', () => ({ setupService: { getStatus: vi.fn() } }));

const stats = {
  success: true,
  data: {
    users: { total: 120, byRole: { customer: 100, manager: 18, admin: 2 } },
    restaurants: { total: 6 },
    orders: { total: 843, byStatus: { ordered: 5, preparing: 3 } }
  }
};

describe('AdminOverview', () => {
  test('mostra la telemetria e la coda dei manager', async () => {
    managerAdminService.getStats.mockResolvedValue(stats);
    managerAdminService.getAllUsers.mockResolvedValue({
      success: true,
      data: [{ _id: 'm1', name: 'Ada', surname: 'Lovelace', email: 'ada@x.it', role: 'manager', managerStatus: 'pending' }]
    });

    render(<AdminOverview />);

    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(screen.getByText('843')).toBeInTheDocument();
    expect(screen.getByText(/cliente/)).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  test('approva un manager in attesa', async () => {
    managerAdminService.getStats.mockResolvedValue(stats);
    managerAdminService.getAllUsers.mockResolvedValue({
      success: true,
      data: [{ _id: 'm1', name: 'Ada', surname: 'L', email: 'ada@x.it' }]
    });
    managerAdminService.updateUser.mockResolvedValue({ success: true });

    render(<AdminOverview />);
    fireEvent.click(await screen.findByRole('button', { name: /approva/i }));

    await waitFor(() => {
      expect(managerAdminService.updateUser).toHaveBeenCalledWith('m1', { managerStatus: 'approved' });
    });
  });

  test('rifiuta un manager in attesa', async () => {
    managerAdminService.getStats.mockResolvedValue(stats);
    managerAdminService.getAllUsers.mockResolvedValue({
      success: true,
      data: [{ _id: 'm1', name: 'Ada', surname: 'L', email: 'ada@x.it' }]
    });
    managerAdminService.updateUser.mockResolvedValue({ success: true });

    render(<AdminOverview />);
    fireEvent.click(await screen.findByRole('button', { name: /rifiuta/i }));

    await waitFor(() => {
      expect(managerAdminService.updateUser).toHaveBeenCalledWith('m1', { managerStatus: 'rejected' });
    });
  });
});
