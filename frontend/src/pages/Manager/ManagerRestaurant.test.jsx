import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ManagerRestaurant } from './ManagerRestaurant.jsx';
import { restaurantService } from '../../services/restaurantService.js';

const { refreshUser, navigate } = vi.hoisted(() => ({ refreshUser: vi.fn(), navigate: vi.fn() }));

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({
    user: { id: 'm1', name: 'Ada', role: 'manager', managerStatus: 'approved', restaurantId: 'r1' },
    refreshUser
  })
}));

vi.mock('../../router/navigate.js', () => ({ navigate }));

vi.mock('../../services/restaurantService.js', () => ({
  restaurantService: { getRestaurant: vi.fn(), updateRestaurant: vi.fn(), deleteRestaurant: vi.fn() }
}));

const branch = {
  success: true,
  data: {
    _id: 'r1',
    name: 'Sede',
    address: 'Via Roma 1',
    city: 'Milano',
    phone: '0212345678',
    vatNumber: 'IT1'
  }
};

describe('ManagerRestaurant', () => {
  test('carica i dati della sede e li salva', async () => {
    restaurantService.getRestaurant.mockResolvedValue(branch);
    restaurantService.updateRestaurant.mockResolvedValue({ success: true });

    render(<ManagerRestaurant />);

    const nameInput = await screen.findByLabelText('nome');
    expect(nameInput.value).toBe('Sede');

    fireEvent.input(nameInput, { target: { value: 'Sede Duomo' } });
    fireEvent.submit(nameInput.closest('form'));

    await waitFor(() => {
      expect(restaurantService.updateRestaurant).toHaveBeenCalledWith('r1', {
        name: 'Sede Duomo',
        address: 'Via Roma 1',
        city: 'Milano',
        phone: '0212345678',
        vatNumber: 'IT1'
      });
    });
  });

  test('chiude la sede solo dopo la conferma', async () => {
    restaurantService.getRestaurant.mockResolvedValue(branch);
    restaurantService.deleteRestaurant.mockResolvedValue({ success: true });

    render(<ManagerRestaurant />);
    await screen.findByLabelText('nome');

    fireEvent.click(screen.getByRole('button', { name: /chiudi la sede/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => {
      expect(restaurantService.deleteRestaurant).toHaveBeenCalledWith('r1');
    });
    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/dashboard/manager');
    });
  });
});
