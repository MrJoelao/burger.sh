import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { AdminBranches } from './AdminBranches.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { managerAdminService } from '../../services/managerAdminService.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { role: 'admin', name: 'root' }, logout: vi.fn() })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/restaurantService.js', () => ({
  restaurantService: { getRestaurants: vi.fn(), createRestaurant: vi.fn(), deleteRestaurant: vi.fn() }
}));

vi.mock('../../services/managerAdminService.js', () => ({
  managerAdminService: { getAllUsers: vi.fn() }
}));

const approvedManager = { _id: 'm2', name: 'Bob', surname: 'Byte', email: 'bob@x.it' };

describe('AdminBranches', () => {
  test('apre una filiale con il manager scelto', async () => {
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: [] });
    managerAdminService.getAllUsers.mockResolvedValue({ success: true, data: [approvedManager] });
    restaurantService.createRestaurant.mockResolvedValue({ success: true });

    render(<AdminBranches />);
    await screen.findByLabelText('nome');

    const values = { nome: 'Sede', indirizzo: 'Via Roma 1', 'città': 'Milano', telefono: '0212345678', 'partita iva': 'IT1' };
    Object.entries(values).forEach(([label, value]) => {
      fireEvent.input(screen.getByLabelText(label), { target: { value } });
    });
    fireEvent.change(screen.getByLabelText('manager'), { target: { value: 'm2' } });
    fireEvent.submit(screen.getByLabelText('nome').closest('form'));

    await waitFor(() => {
      expect(restaurantService.createRestaurant).toHaveBeenCalledWith({
        name: 'Sede',
        address: 'Via Roma 1',
        city: 'Milano',
        phone: '0212345678',
        vatNumber: 'IT1',
        managerId: 'm2'
      });
    });
  });

  test('trasferisce una filiale a un altro manager', async () => {
    restaurantService.getRestaurants.mockResolvedValue({
      success: true,
      data: [{
        _id: 'r1',
        name: 'Sede',
        address: 'Via Roma 1',
        city: 'Milano',
        managerId: { _id: 'm1', name: 'Ada', surname: 'L' }
      }]
    });
    managerAdminService.getAllUsers.mockResolvedValue({ success: true, data: [approvedManager] });
    restaurantService.deleteRestaurant.mockResolvedValue({ success: true });

    render(<AdminBranches />);
    await screen.findByText('Sede');

    fireEvent.change(screen.getByLabelText('trasferisci a'), { target: { value: 'm2' } });
    fireEvent.click(screen.getByRole('button', { name: /trasferisci/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => {
      expect(restaurantService.deleteRestaurant).toHaveBeenCalledWith('r1', { newManagerId: 'm2' });
    });
  });
});
