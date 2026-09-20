import { render, screen, fireEvent, waitFor, within } from '@testing-library/preact';
import { OrderDetailPage } from './OrderDetailPage.jsx';
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

function timeline() {
  return within(screen.getByRole('list', { name: /avanzamento/i }));
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    orderService.getOrder.mockReset();
    orderService.confirmDelivery.mockReset();
  });

  test('carica il dettaglio dell ordine richiesto', async () => {
    orderService.getOrder.mockResolvedValue({ success: true, data: order() });

    render(<OrderDetailPage orderId="o1" />);

    await waitFor(() => expect(orderService.getOrder).toHaveBeenCalledWith('o1'));
    expect(await screen.findByText('FF-A1B2C3')).toBeInTheDocument();
  });

  test('il ritiro non passa da IN CONSEGNA', async () => {
    orderService.getOrder.mockResolvedValue({ success: true, data: order({ mode: 'pickup', status: 'preparing' }) });

    render(<OrderDetailPage orderId="o1" />);
    await screen.findByText('FF-A1B2C3');

    expect(timeline().getByText('PRONTO')).toBeInTheDocument();
    expect(timeline().queryByText('IN CONSEGNA')).not.toBeInTheDocument();
  });

  test('il domicilio non passa da PRONTO', async () => {
    orderService.getOrder.mockResolvedValue({ success: true, data: order({ mode: 'delivery', status: 'preparing' }) });

    render(<OrderDetailPage orderId="o1" />);
    await screen.findByText('FF-A1B2C3');

    expect(timeline().getByText('IN CONSEGNA')).toBeInTheDocument();
    expect(timeline().queryByText('PRONTO')).not.toBeInTheDocument();
  });

  test('propone la conferma di ricezione solo a un ordine a domicilio in consegna', async () => {
    orderService.getOrder.mockResolvedValue({ success: true, data: order({ mode: 'delivery', status: 'on_delivery' }) });
    orderService.confirmDelivery.mockResolvedValue({ success: true });

    render(<OrderDetailPage orderId="o1" />);
    fireEvent.click(await screen.findByRole('button', { name: /conferma ricezione/i }));

    await waitFor(() => expect(orderService.confirmDelivery).toHaveBeenCalledWith('o1'));
  });

  test('un ordine in ritiro non propone la conferma di ricezione', async () => {
    orderService.getOrder.mockResolvedValue({ success: true, data: order({ mode: 'pickup', status: 'ready' }) });

    render(<OrderDetailPage orderId="o1" />);
    await screen.findByText('FF-A1B2C3');

    expect(screen.queryByRole('button', { name: /conferma ricezione/i })).not.toBeInTheDocument();
  });
});
