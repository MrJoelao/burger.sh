/* regressione: la rotta /orders/:orderId deve passare l id al componente con lo
   stesso nome del parametro, altrimenti il dettaglio ordine chiede
   /orders/undefined e resta rotto. */

import { render, waitFor } from '@testing-library/preact';
import { AppRouter } from './AppRouter.jsx';
import { orderService } from '../services/orderService.js';
import { setupService } from '../services/setupService.js';

vi.mock('../state/authStore.js', () => ({
  useAuthStore: () => ({
    user: { id: 'c1', name: 'Luca', role: 'customer' },
    isAuthenticated: true,
    loading: false
  })
}));

vi.mock('./navigate.js', () => ({ navigate: vi.fn() }));
vi.mock('../state/uiStore.js', () => ({ useUIStore: () => ({ showToast: vi.fn() }) }));
vi.mock('../services/setupService.js', () => ({ setupService: { getStatus: vi.fn() } }));
vi.mock('../services/orderService.js', () => ({
  orderService: { getUserOrders: vi.fn(), getOrder: vi.fn(), confirmDelivery: vi.fn() }
}));

describe('AppRouter - dettaglio ordine del cliente', () => {
  beforeEach(() => {
    setupService.getStatus.mockResolvedValue({ success: true, data: { adminExists: true, setupCompleted: true } });
    orderService.getOrder.mockResolvedValue({
      success: true,
      data: { _id: 'abc', orderCode: 'FF-A1B2C3', status: 'ordered', mode: 'pickup', orderItems: [] }
    });
    window.history.pushState({}, '', '/orders/abc');
  });

  test('passa l id dell ordine al componente del dettaglio', async () => {
    render(<AppRouter />);

    await waitFor(() => expect(orderService.getOrder).toHaveBeenCalledWith('abc'));
  });
});
