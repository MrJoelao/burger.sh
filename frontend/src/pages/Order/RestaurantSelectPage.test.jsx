import { render, screen, fireEvent } from '@testing-library/preact';
import { RestaurantSelectPage } from './RestaurantSelectPage.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { navigate } from '../../router/navigate.js';
import { useOrderStore } from '../../state/orderStore.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { id: 'c1', name: 'Luca', role: 'customer' } })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/restaurantService.js', () => ({
  restaurantService: { getRestaurants: vi.fn() }
}));

vi.mock('../../state/orderStore.js', () => ({ useOrderStore: vi.fn() }));

const FILIALI = [
  { _id: 'r1', name: 'Burger Duomo', city: 'Milano', address: 'Piazza Duomo 1' },
  { _id: 'r2', name: 'Burger Navona', city: 'Roma', address: 'Piazza Navona 2' }
];

describe('RestaurantSelectPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('elenca le filiali con la ricerca per nome o città', async () => {
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: FILIALI });

    render(<RestaurantSelectPage />);

    expect(await screen.findByText('Burger Duomo')).toBeInTheDocument();
    expect(screen.getByText('Burger Navona')).toBeInTheDocument();
    expect(restaurantService.getRestaurants).toHaveBeenCalled();
  });

  test('filtra le filiali mentre si digita', async () => {
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: FILIALI });

    render(<RestaurantSelectPage />);
    await screen.findByText('Burger Duomo');

    fireEvent.input(screen.getByPlaceholderText(/cerca filiale/i), { target: { value: 'roma' } });

    expect(screen.getByText('Burger Navona')).toBeInTheDocument();
    expect(screen.queryByText('Burger Duomo')).not.toBeInTheDocument();
  });

  test('apre il menu della filiale scelta', async () => {
    const selectRestaurant = vi.fn().mockReturnValue(true);
    useOrderStore.mockReturnValue({ selectRestaurant });
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: FILIALI });

    render(<RestaurantSelectPage />);
    fireEvent.click(await screen.findByRole('button', { name: /burger duomo/i }));

    expect(selectRestaurant).toHaveBeenCalledWith(FILIALI[0]);
    expect(navigate).toHaveBeenCalledWith('/orders/menu/r1');
  });

  test('senza filiali invita a riprovare più tardi', async () => {
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: [] });

    render(<RestaurantSelectPage />);

    expect(await screen.findByText(/nessuna filiale/i)).toBeInTheDocument();
  });
});