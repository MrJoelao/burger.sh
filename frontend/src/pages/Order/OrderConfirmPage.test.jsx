import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { OrderConfirmPage } from './OrderConfirmPage.jsx';
import { useOrderStore } from '../../state/orderStore.js';
import { navigate } from '../../router/navigate.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { id: 'c1', name: 'Luca', role: 'customer' } })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../state/orderStore.js', () => ({ useOrderStore: vi.fn() }));

const ITEMS = [{ dishId: 'd1', name: 'Cheeseburger', price: 6.5, quantity: 2 }];

function storeWith(items = ITEMS, overrides = {}) {
  return { items, confirmCart: vi.fn().mockResolvedValue({ success: true, data: { _id: 'o9' } }), ...overrides };
}

describe('OrderConfirmPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('riassume il carrello mappato dalle righe del backend', () => {
    useOrderStore.mockReturnValue(storeWith());

    render(<OrderConfirmPage />);

    expect(screen.getByText('Cheeseburger')).toBeInTheDocument();
    /* riga (2 × 6.50), subtotale e totale stimato coincidono con un solo piatto in ritiro */
    expect(screen.getAllByText('€ 13.00')).toHaveLength(3);
  });

  test('conferma il carrello e apre l ordine appena creato', async () => {
    const store = storeWith();
    useOrderStore.mockReturnValue(store);

    render(<OrderConfirmPage />);
    fireEvent.click(screen.getByRole('button', { name: /conferma ordine/i }));

    await waitFor(() => expect(store.confirmCart).toHaveBeenCalledWith('pickup', undefined));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/orders/o9'));
  });

  test('non conferma una consegna senza indirizzo', async () => {
    const store = storeWith();
    useOrderStore.mockReturnValue(store);

    render(<OrderConfirmPage />);
    fireEvent.click(screen.getByRole('button', { name: /consegna/i }));
    fireEvent.click(screen.getByRole('button', { name: /conferma ordine/i }));

    expect(await screen.findByText(/completa via, città e cap/i)).toBeInTheDocument();
    expect(store.confirmCart).not.toHaveBeenCalled();
  });

  test('un carrello vuoto non porta al checkout', () => {
    useOrderStore.mockReturnValue(storeWith([]));

    render(<OrderConfirmPage />);

    expect(screen.getByText(/carrello è vuoto/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /conferma ordine/i })).not.toBeInTheDocument();
  });
});
