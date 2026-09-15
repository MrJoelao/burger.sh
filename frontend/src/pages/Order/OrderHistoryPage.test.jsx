import { render, screen, fireEvent } from '@testing-library/preact';
import { OrderHistoryPage } from './OrderHistoryPage.jsx';
import { orderService } from '../../services/orderService.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { id: 'c1', name: 'Luca', role: 'customer' } })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/orderService.js', () => ({
  orderService: { getUserOrders: vi.fn(), getOrder: vi.fn(), confirmDelivery: vi.fn() }
}));

function order(overrides = {}) {
  return {
    _id: 'o1',
    orderCode: 'FF-A1B2C3',
    status: 'preparing',
    mode: 'pickup',
    totalAmount: 13,
    createdAt: '2024-01-01T10:00:00Z',
    restaurantId: { _id: 'r1', name: 'Duomo', city: 'Milano' },
    orderItems: [{ quantity: 2, unitPrice: 6.5, dishId: { name: 'Cheeseburger' } }],
    ...overrides
  };
}

describe('OrderHistoryPage', () => {
  beforeEach(() => {
    orderService.getUserOrders.mockReset();
  });

  test('mostra il codice ordine e il nome della filiale popolata', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [order()] });

    render(<OrderHistoryPage />);

    expect(await screen.findByText('FF-A1B2C3')).toBeInTheDocument();
    expect(screen.getByText(/Duomo/)).toBeInTheDocument();
  });

  test('chiede al server solo il filtro scelto', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [order()] });

    render(<OrderHistoryPage />);
    await screen.findByText('FF-A1B2C3');

    fireEvent.click(screen.getByRole('button', { name: /in corso/i }));

    await screen.findByText('FF-A1B2C3');
    expect(orderService.getUserOrders).toHaveBeenLastCalledWith('current');
  });

  test('un carrello in bozza non compare tra gli ordini', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [] });

    render(<OrderHistoryPage />);

    expect(await screen.findByText(/nessun ordine/i)).toBeInTheDocument();
  });

  test('dal riquadro di un ordine si apre il dettaglio', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [order()] });
    const { navigate } = await import('../../router/navigate.js');

    render(<OrderHistoryPage />);
    fireEvent.click(await screen.findByRole('button', { name: /dettagli/i }));

    expect(navigate).toHaveBeenCalledWith('/orders/o1');
  });
});
