import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { OrderMenuPage } from './OrderMenuPage.jsx';
import { restaurantService } from '../../services/restaurantService.js';
import { navigate } from '../../router/navigate.js';
import { useOrderStore } from '../../state/orderStore.js';
import { useAuthStore } from '../../state/authStore.js';

vi.mock('../../state/authStore.js', () => {
  const useAuthStore = vi.fn(() => ({ user: null, isAuthenticated: false }));
  return { useAuthStore };
});

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/restaurantService.js', () => ({
  restaurantService: { getRestaurant: vi.fn(), getDishesByRestaurant: vi.fn() }
}));

vi.mock('../../state/orderStore.js', () => ({ useOrderStore: vi.fn() }));

const RESTAURANT = { _id: 'r1', name: 'Burger Duomo', city: 'Milano' };

const DISHES = [
  { _id: 'd1', name: 'Cheeseburger', type: 'burger', price: 6.5, photoUrl: 'https://images.example.test/cheeseburger.jpg' },
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
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

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
    expect(screen.getByRole('article', { name: 'Cheeseburger' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Cheeseburger' })).toHaveAttribute('src', DISHES[0].photoUrl);
  });

  test('filtra il menu per testo e allergene escluso', async () => {
    const dishes = [
      { ...DISHES[0], ingredientIds: [{ name: 'pane', allergens: ['glutine'] }] },
      { ...DISHES[1], ingredientIds: [{ name: 'lattuga', allergens: [] }] }
    ];
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: dishes });
    useOrderStore.mockReturnValue(storeWith());

    render(<OrderMenuPage restaurantId="r1" />);

    const search = await screen.findByPlaceholderText('nome o ingrediente');
    fireEvent.input(search, { target: { value: 'veggie' } });
    expect(screen.getByText('Burger veggie')).toBeInTheDocument();
    expect(screen.queryByText('Cheeseburger')).not.toBeInTheDocument();

    fireEvent.input(search, { target: { value: '' } });
    fireEvent.click(screen.getByLabelText('glutine'));
    expect(screen.queryByText('Cheeseburger')).not.toBeInTheDocument();
    expect(screen.getByText('Burger veggie')).toBeInTheDocument();
  });

  test('aggiunge un piatto al carrello con filiale e piatto', async () => {
    const store = storeWith();
    useAuthStore.mockReturnValue({ user: { id: 'c1' }, isAuthenticated: true });
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(store);

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /aggiungi cheeseburger/i }));

    await waitFor(() => expect(store.addCartItem).toHaveBeenCalledWith('r1', 'd1', 1));
  });

  test('modifica la quantità di un piatto già nel carrello', async () => {
    const store = storeWith({ items: [{ dishId: 'd1', name: 'Cheeseburger', price: 6.5, quantity: 2 }] });
    useAuthStore.mockReturnValue({ user: { id: 'c1' }, isAuthenticated: true });
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(store);

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /più cheeseburger/i }));

    await waitFor(() => expect(store.updateCartItem).toHaveBeenCalledWith('d1', 3));
  });

  test('porta al pagamento solo con un carrello pieno', async () => {
    const store = storeWith({ items: [{ dishId: 'd1', name: 'Cheeseburger', price: 6.5, quantity: 1 }] });
    useAuthStore.mockReturnValue({ user: { id: 'c1' }, isAuthenticated: true });
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(store);

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /checkout/i }));

    expect(navigate).toHaveBeenCalledWith('/orders/payment');
  });

  test('torna alla scelta della filiale', async () => {
    useAuthStore.mockReturnValue({ user: null, isAuthenticated: false });
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(storeWith());

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /cambia filiale/i }));

    expect(navigate).toHaveBeenCalledWith('/orders');
  });

  test('un ospite aggiunge e modifica i piatti nel carrello locale senza chiamare le API', async () => {
    const store = storeWith();
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(store);

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /aggiungi cheeseburger/i }));
    fireEvent.click(screen.getByRole('button', { name: /più cheeseburger/i }));

    expect(store.fetchCart).not.toHaveBeenCalled();
    expect(store.addCartItem).not.toHaveBeenCalled();
    expect(store.updateCartItem).not.toHaveBeenCalled();
    expect(screen.queryByText(/SESSIONE_/i)).not.toBeInTheDocument();
    expect(screen.getByText(/qty 2/i)).toBeInTheDocument();
  });



  test('mostra la modale auth solo quando un ospite prova il checkout', async () => {
    const store = storeWith();
    restaurantService.getRestaurant.mockResolvedValue({ success: true, data: RESTAURANT });
    restaurantService.getDishesByRestaurant.mockResolvedValue({ success: true, data: DISHES });
    useOrderStore.mockReturnValue(store);

    render(<OrderMenuPage restaurantId="r1" />);
    fireEvent.click(await screen.findByRole('button', { name: /aggiungi cheeseburger/i }));
    fireEvent.click(screen.getByRole('button', { name: /checkout/i }));

    expect(await screen.findByText(/SESSIONE_/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalledWith('/orders/payment');
  });
});