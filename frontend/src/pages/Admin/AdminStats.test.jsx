import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { AdminStats } from './AdminStats.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { role: 'admin', name: 'root' }, logout: vi.fn() })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/managerAdminService.js', () => ({
  managerAdminService: { getStats: vi.fn() }
}));

describe('AdminStats', () => {
  test('mostra i totali e la quota per voce', async () => {
    managerAdminService.getStats.mockResolvedValue({
      success: true,
      data: {
        users: { total: 10, byRole: { customer: 8, manager: 2 } },
        restaurants: { total: 3 },
        orders: { total: 0, byStatus: {} }
      }
    });

    render(<AdminStats />);

    expect(await screen.findByText('10')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });
});
