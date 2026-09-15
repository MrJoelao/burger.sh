import { render, screen, fireEvent } from '@testing-library/preact';
import { CustomerDashboard } from './CustomerDashboard.jsx';
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
    status: 'delivered',
    mode: 'pickup',
    totalAmount: 20,
    createdAt: '2024-01-01T10:00:00Z',
    restaurantId: { name: 'Duomo', city: 'Milano' },
    orderItems: [{ quantity: 2, unitPrice: 10, dishId: { name: 'Cheeseburger' } }],
    ...overrides
  };
}

describe('CustomerDashboard', () => {
  beforeEach(() => {
    orderService.getUserOrders.mockReset();
  });

  test('riassume i propri ordini con la spesa dei consegnati', async () => {
    orderService.getUserOrders.mockResolvedValue({
      success: true,
      data: [order({ status: 'delivered', totalAmount: 20 }), order({ _id: 'o2', orderCode: 'FF-D9E8F7', status: 'preparing', totalAmount: 13 })]
    });

    render(<CustomerDashboard />);

    expect(await screen.findByText('€ 20.00')).toBeInTheDocument();
    expect(screen.getByText('FF-A1B2C3')).toBeInTheDocument();
  });

  test('apre il dettaglio di un ordine recente', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [order()] });
    const { navigate } = await import('../../router/navigate.js');

    render(<CustomerDashboard />);
    fireEvent.click(await screen.findByRole('button', { name: /dettagli/i }));

    expect(navigate).toHaveBeenCalledWith('/orders/o1');
  });

  test('senza ordini invita a ordinare dal menu', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [] });

    render(<CustomerDashboard />);

    expect(await screen.findByText(/nessun ordine/i)).toBeInTheDocument();
  });
});
