import { render, screen, fireEvent } from '@testing-library/preact';
import { OrdersPanel } from './OrdersPanel.jsx';
import { orderService } from '../../../services/orderService.js';
import { navigate } from '../../../router/navigate.js';

vi.mock('../../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../../services/orderService.js', () => ({
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

describe('OrdersPanel', () => {
  beforeEach(() => {
    orderService.getUserOrders.mockReset();
  });

  test('mostra lo storico con il codice dell ordine', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [order()] });

    render(<OrdersPanel active />);

    expect(await screen.findByText('FF-A1B2C3')).toBeInTheDocument();
    expect(screen.getByText(/Duomo/)).toBeInTheDocument();
  });

  test('chiede al server solo il filtro scelto', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [order()] });

    render(<OrdersPanel active />);
    await screen.findByText('FF-A1B2C3');

    fireEvent.click(screen.getByRole('button', { name: /consegnati/i }));

    await screen.findByText('FF-A1B2C3');
    expect(orderService.getUserOrders).toHaveBeenLastCalledWith('past');
  });

  test('senza ordini invita a effettuarne uno', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [] });

    render(<OrdersPanel active />);

    expect(await screen.findByText(/nessun ordine/i)).toBeInTheDocument();
  });

  test('dal riquadro di un ordine si apre il dettaglio', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [order()] });

    render(<OrdersPanel active />);
    fireEvent.click(await screen.findByRole('button', { name: /dettagli/i }));

    expect(navigate).toHaveBeenCalledWith('/orders/o1');
  });
});