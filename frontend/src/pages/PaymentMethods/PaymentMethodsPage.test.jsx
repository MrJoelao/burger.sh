import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { PaymentMethodsPage } from './PaymentMethodsPage.jsx';
import { paymentService } from '../../services/paymentService.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { id: 'c1', name: 'Luca', role: 'customer' } })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/paymentService.js', () => ({
  paymentService: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }
}));

const CARD = { _id: 'p1', type: 'card', label: 'Principale', details: '4242', isDefault: true };
const CASH = { _id: 'p2', type: 'cash', label: 'Alla cassa', isDefault: false };

describe('PaymentMethodsPage', () => {
  beforeEach(() => {
    paymentService.list.mockReset();
    paymentService.create.mockReset();
    paymentService.remove.mockReset();
  });

  test('elenca i metodi salvati mostrando solo le ultime quattro cifre', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [CARD, CASH] });

    render(<PaymentMethodsPage />);

    expect(await screen.findByText('•••• 4242')).toBeInTheDocument();
    expect(screen.getByText('Principale')).toBeInTheDocument();
    expect(screen.getByText('Alla cassa')).toBeInTheDocument();
  });

  test('aggiunge una carta con il payload accettato dal backend', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    paymentService.create.mockResolvedValue({ success: true, data: CARD });

    render(<PaymentMethodsPage />);
    await screen.findByText(/nessun metodo/i);

    fireEvent.input(screen.getByLabelText('etichetta'), { target: { value: 'Principale' } });
    fireEvent.input(screen.getByLabelText(/4 cifre/i), { target: { value: '4242' } });
    fireEvent.click(screen.getByRole('button', { name: /aggiungi/i }));

    await waitFor(() => {
      expect(paymentService.create).toHaveBeenCalledWith({ type: 'card', label: 'Principale', details: '4242', isDefault: false });
    });
  });

  test('non invia nulla se le cifre della carta non sono quattro', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [] });

    render(<PaymentMethodsPage />);
    await screen.findByText(/nessun metodo/i);

    fireEvent.input(screen.getByLabelText('etichetta'), { target: { value: 'Principale' } });
    fireEvent.input(screen.getByLabelText(/4 cifre/i), { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /aggiungi/i }));

    expect(await screen.findByText(/servono le ultime 4 cifre/i)).toBeInTheDocument();
    expect(paymentService.create).not.toHaveBeenCalled();
  });

  test('elimina un metodo solo dopo la conferma', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [CARD] });
    paymentService.remove.mockResolvedValue({ success: true });

    render(<PaymentMethodsPage />);
    fireEvent.click(await screen.findByRole('button', { name: /elimina/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => expect(paymentService.remove).toHaveBeenCalledWith('p1'));
  });
});
