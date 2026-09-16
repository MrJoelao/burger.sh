import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { OrderMenuPage } from './OrderMenuPage.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { navigate } from '../../router/navigate.js';
import { useOrderStore } from '../../state/orderStore.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { id: 'c1', name: 'Luca', role: 'customer' } })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/restaurantService.js', () => ({
  restaurantService: { getRestaurant: vi.fn(), getDishesByRestaurant: vi.fn() }
}));

vi.mock('../../state/orderStore.js', () => ({ useOrderStore: vi.fn() }));

const RESTAURANT = { _id: 'r1', name: 'Burger Duomo', city: 'Milano' };

const DISHES = [
  { _id: 'd1', name: 'Cheeseburger', type: 'burger', price: 6.5 },
  { _id: 'd2', name: 'Burger veggie', type: 'burger', price: 7 },
  { _id: 'd3', name: 'Patatine', type: 'side', price: 3 },
  { _id: 'd4', name: 'Cola', type: 'drink', price: 2.5 }
];

function storeWith(overrides = {}) {
  return {
    items: [],
    addCartItem: vi.fn().mockResolvedValue({ success: true }),
    updateCartItem: vi.fn().mockResolvedValue({ success: true }),
    removeCartItem: vi.fn().mockResolvedValue({ success: true }),
    clearCart: vi.fn().mockResolvedValue({ success: true }),
    fetchCart: vi.fn().mockResolvedValue(null),
    selectRestaurant: vi.fn().mockReturnValue(true),
    ...overrides
  };
}

describe('OrderMenuPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('mostra i piatti divisi per sezione', async () => {
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(storeWith());

    render(<OrderMenuPage restaurantId="r1" />);

    expect(await screen.findByText('Cheeseburger')).toBeInTheDocument();
    expect(screen.getByText('Patatine')).toBeInTheDocument();
    expect(screen.getByText('Cola')).toBeInTheDocument();
    expect(screen.getAllByText('PANINI')).not.toHaveLength(0);
    expect(screen.getByText('SIDES')).toBeInTheDocument();
    expect(screen.getByText('BEVANDE')).toBeInTheDocument();
  });

  test('aggiunge un piatto al carrello con filiale e piatto', async () => {
    const store = storeWith();
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(store);

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /aggiungi cheeseburger/i }));

    await waitFor(() => expect(store.addCartItem).toHaveBeenCalledWith('r1', 'd1', 1));
  });

  test('modifica la quantità di un piatto già nel carrello', async () => {
    const store = storeWith({ items: [{ dishId: 'd1', name: 'Cheeseburger', price: 6.5, quantity: 2 }] });
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(store);

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /più cheeseburger/i }));

    await waitFor(() => expect(store.updateCartItem).toHaveBeenCalledWith('d1', 3));
  });

  test('porta al pagamento solo con un carrello pieno', async () => {
    const store = storeWith({ items: [{ dishId: 'd1', name: 'Cheeseburger', price: 6.5, quantity: 1 }] });
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(store);

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /checkout/i }));

    expect(navigate).toHaveBeenCalledWith('/orders/payment');
  });

  test('torna alla scelta della filiale', async () => {
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(storeWith());

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /cambia filiale/i }));

    expect(navigate).toHaveBeenCalledWith('/orders');
  });
});