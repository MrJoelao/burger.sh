import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ManagerMenu } from './ManagerMenu.jsx';
import { restaurantService } from '../../services/restaurantService.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({
    user: { id: 'm1', name: 'Ada', role: 'manager', managerStatus: 'approved', restaurantId: 'r1' }
  })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/restaurantService.js', () => ({
  restaurantService: {
    getDishesByRestaurant: vi.fn(),
    createDish: vi.fn(),
    updateDish: vi.fn(),
    deleteDish: vi.fn()
  }
}));

const dishes = [
  { _id: 'd1', name: 'Cheeseburger', type: 'burger', price: 6.5, isCustom: false, restaurantId: null },
  { _id: 'd2', name: 'Del Duomo', type: 'burger', price: 8.9, isCustom: true, restaurantId: 'r1' }
];

describe('ManagerMenu', () => {
  test('il menu comune è di sola lettura, i custom sono gestibili', async () => {
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: dishes });

    render(<ManagerMenu />);
    await screen.findByText('Del Duomo');

    expect(screen.getByText('sola lettura')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /modifica/i })).toBeInTheDocument();
    expect(restaurantService.getDishesByRestaurant).toHaveBeenCalledWith('r1', { limit: 100 });
  });

  test('crea un piatto custom per la filiale', async () => {
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: [] });
    restaurantService.createDish.mockResolvedValue({ success: true });

    render(<ManagerMenu />);
    await screen.findAllByText(/nessun piatto/i);

    fireEvent.click(screen.getByRole('button', { name: /nuovo piatto custom/i }));
    const form = screen.getByLabelText('nome').closest('form');
    const inputs = form.querySelectorAll('input');
    fireEvent.input(inputs[0], { target: { value: 'Veggie' } });
    fireEvent.input(inputs[1], { target: { value: 'burger' } });
    fireEvent.input(inputs[2], { target: { value: '7.5' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(restaurantService.createDish).toHaveBeenCalledWith('r1', {
        name: 'Veggie',
        type: 'burger',
        price: 7.5
      });
    });
  });

  test('modifica un piatto custom', async () => {
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: dishes });
    restaurantService.updateDish.mockResolvedValue({ success: true });

    render(<ManagerMenu />);
    await screen.findByText('Del Duomo');

    fireEvent.click(screen.getByRole('button', { name: /modifica/i }));

    const nameInput = screen.getByLabelText('nome');
    expect(nameInput.value).toBe('Del Duomo');

    fireEvent.input(nameInput, { target: { value: 'Del Duomo XXL' } });
    fireEvent.submit(nameInput.closest('form'));

    await waitFor(() => {
      expect(restaurantService.updateDish).toHaveBeenCalledWith('d2', {
        name: 'Del Duomo XXL',
        type: 'burger',
        price: 8.9
      });

    });
  });

  test('filtra custom e comuni con la ricerca del menu cliente', async () => {
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: dishes });

    render(<ManagerMenu />);
    await screen.findByText('Del Duomo');

    fireEvent.input(screen.getByPlaceholderText('nome o ingrediente'), { target: { value: 'cheese' } });

    expect(screen.getByText('Cheeseburger')).toBeInTheDocument();
    expect(screen.queryByText('Del Duomo')).not.toBeInTheDocument();
  });

  test('elimina un piatto custom solo dopo la conferma', async () => {
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: dishes });
    restaurantService.deleteDish.mockResolvedValue({ success: true });

    render(<ManagerMenu />);
    await screen.findByText('Del Duomo');

    fireEvent.click(screen.getByRole('button', { name: /elimina/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => {
      expect(restaurantService.deleteDish).toHaveBeenCalledWith('d2');
    });
  });
});
