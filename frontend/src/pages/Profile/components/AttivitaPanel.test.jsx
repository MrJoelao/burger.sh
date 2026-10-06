import { render, screen } from '@testing-library/preact';
import { AttivitaPanel } from './AttivitaPanel.jsx';
import { orderService } from '../../../services/orderService.js';

vi.mock('../../../services/orderService.js', () => ({
  orderService: { getUserOrders: vi.fn(), getOrder: vi.fn(), confirmDelivery: vi.fn() }
}));

describe('AttivitaPanel', () => {
  test('riassume ordini e spesa del cliente', async () => {
    orderService.getUserOrders.mockResolvedValue({
      success: true,
      data: [
        { _id: 'o1', status: 'delivered', totalAmount: 20 },
        { _id: 'o2', status: 'delivered', totalAmount: 5 },
        { _id: 'o3', status: 'preparing', totalAmount: 13 }
      ]
    });

    render(<AttivitaPanel active />);

    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('€ 25.00')).toBeInTheDocument();
  });

  test('senza ordini mostra le metriche a zero', async () => {
    orderService.getUserOrders.mockResolvedValue({ success: true, data: [] });

    render(<AttivitaPanel active />);

    expect(await screen.findByText('ordini totali')).toBeInTheDocument();
    expect(screen.getByText('€ 0.00')).toBeInTheDocument();
  });
});