import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ManagerOrders } from './ManagerOrders.jsx';
import { managerAdminService } from '../../services/managerAdminService.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({
    user: { id: 'm1', name: 'Ada', role: 'manager', managerStatus: 'approved', restaurantId: 'r1' }
  })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/managerAdminService.js', () => ({
  managerAdminService: { getRestaurantOrders: vi.fn(), updateOrderStatus: vi.fn() }
}));

function order(overrides) {
  return {
    _id: 'o1',
    orderCode: 'FF-AAA',
    status: 'preparing',
    mode: 'pickup',
    totalAmount: 13,
    createdAt: '2024-01-01T10:00:00Z',
    customerId: { name: 'Luca', surname: 'B' },
    orderItems: [{ quantity: 2, dishId: { name: 'Cheeseburger' } }],
    ...overrides
  };
}

describe('ManagerOrders', () => {
  test('propone la mossa ammessa dalla modalità di ogni ordine', async () => {
    managerAdminService.getRestaurantOrders.mockResolvedValue({
      success: true,
      data: [
        order({ _id: 'o1', orderCode: 'FF-AAA', mode: 'pickup' }),
        order({ _id: 'o2', orderCode: 'FF-BBB', mode: 'delivery' })
      ]
    });

    render(<ManagerOrders />);

    expect(await screen.findByText('FF-AAA')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /PRONTO/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /IN CONSEGNA/i })).toBeInTheDocument();
    expect(managerAdminService.getRestaurantOrders).toHaveBeenCalledWith('r1', { status: '', limit: 50 });
  });

  test('avanza l’ordine al prossimo stato della sua modalità', async () => {
    managerAdminService.getRestaurantOrders.mockResolvedValue({ success: true, data: [order({ _id: 'o1' })] });
    managerAdminService.updateOrderStatus.mockResolvedValue({ success: true });

    render(<ManagerOrders />);
    fireEvent.click(await screen.findByRole('button', { name: /PRONTO/i }));

    await waitFor(() => {
      expect(managerAdminService.updateOrderStatus).toHaveBeenCalledWith('o1', 'ready');
    });
  });

  test('filtra la coda chiedendo al server solo lo stato scelto', async () => {
    managerAdminService.getRestaurantOrders.mockImplementation((_, params = {}) =>
      Promise.resolve({
        success: true,
        data: params.status === 'ready'
          ? [order({ _id: 'o3', orderCode: 'FF-CCC', status: 'ready', mode: 'pickup' })]
          : [
              order({ _id: 'o1', orderCode: 'FF-AAA', status: 'preparing', mode: 'pickup' }),
              order({ _id: 'o3', orderCode: 'FF-CCC', status: 'ready', mode: 'pickup' })
            ]
      })
    );

    render(<ManagerOrders />);
    await screen.findByText('FF-AAA');

    fireEvent.change(screen.getByLabelText('stato'), { target: { value: 'ready' } });

    await waitFor(() => {
      expect(managerAdminService.getRestaurantOrders).toHaveBeenCalledWith('r1', { status: 'ready', limit: 50 });
    });
    expect(await screen.findByText('FF-CCC')).toBeInTheDocument();
    expect(screen.queryByText('FF-AAA')).not.toBeInTheDocument();
  });

  test('non propone stati che il backend rifiuterebbe nel filtro', async () => {
    managerAdminService.getRestaurantOrders.mockResolvedValue({ success: true, data: [order({})] });

    render(<ManagerOrders />);
    await screen.findByText('FF-AAA');

    expect(screen.queryByRole('option', { name: /CONFERMATO/i })).not.toBeInTheDocument();
  });
});
