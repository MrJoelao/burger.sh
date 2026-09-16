import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { OrderPaymentPage } from './OrderPaymentPage.jsx';
import { paymentService } from '../../services/paymentService.js';
import { navigate } from '../../router/navigate.js';
import { useOrderStore } from '../../state/orderStore.js';
import { useAuthStore } from '../../state/authStore.js';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'c1', name: 'Luca', role: 'customer' },
    isAuthenticated: true
  }))
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/paymentService.js', () => ({
  paymentService: { list: vi.fn(), create: vi.fn() }
}));

vi.mock('../../state/orderStore.js', () => ({ useOrderStore: vi.fn() }));

const ITEMS = [{ dishId: 'd1', name: 'Cheeseburger', price: 6.5, quantity: 2 }];

function storeWith(overrides = {}) {
  return {
    items: ITEMS,
    confirmCart: vi.fn().mockResolvedValue({ success: true, data: { _id: 'o9', orderCode: 'FF-A1B2C3' } }),
    fetchCart: vi.fn().mockResolvedValue(null),
    ...overrides
  };
}

async function renderPage(overrides = {}) {
  paymentService.list.mockResolvedValue({ success: true, data: [] });
  useOrderStore.mockReturnValue(storeWith(overrides));
  render(<OrderPaymentPage />);
  await screen.findByText(/DOVE ARRIVA/);
  return useOrderStore.mock.results.at(-1).value;
}

function continueToPayment() {
  fireEvent.click(screen.getByRole('button', { name: /continua al pagamento/i }));
}

function continueToSummary() {
  fireEvent.click(screen.getByRole('button', { name: /continua al riepilogo/i }));
}

describe('OrderPaymentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.mockReturnValue({
      user: { id: 'c1', name: 'Luca', role: 'customer' },
      isAuthenticated: true
    });
  });

  test('mostra un solo navigatore del wizard durante il checkout', async () => {
    await renderPage();

    expect(screen.getAllByRole('list', { name: /passi dell.?ordine/i })).toHaveLength(1);
    expect(screen.queryByText('riepilogo')).not.toBeInTheDocument();
    expect(screen.queryByText(/checkout guidato/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/chiudi l'ordine/i)).not.toBeInTheDocument();
    expect(screen.queryByText('indirizzo di consegna')).not.toBeInTheDocument();
  });

  test('passa dal ritiro al pagamento e poi al riepilogo', async () => {
    await renderPage();

    continueToPayment();
    expect(await screen.findByText('COME_')).toBeInTheDocument();
    continueToSummary();

    expect(await screen.findByText('TUTTO_')).toBeInTheDocument();
    expect(screen.getByText('totale stimato')).toBeInTheDocument();
  });

  test('una consegna a domicilio richiede via, città e CAP', async () => {
    await renderPage();

    fireEvent.click(screen.getByRole('radio', { name: /consegna a domicilio/i }));
    continueToPayment();

    expect(await screen.findByText(/completa via, città e cap/i)).toBeInTheDocument();
    expect(screen.getByText(/DOVE ARRIVA/)).toBeInTheDocument();
  });

  test('una consegna completa invia modalità e indirizzo alla conferma', async () => {
    const store = await renderPage();

    fireEvent.click(screen.getByRole('radio', { name: /consegna a domicilio/i }));
    fireEvent.input(screen.getByLabelText('via e numero'), { target: { value: 'Via Roma 1' } });
    fireEvent.input(screen.getByLabelText('città'), { target: { value: 'Milano' } });
    fireEvent.input(screen.getByLabelText(/cap/i), { target: { value: '20100' } });
    continueToPayment();
    continueToSummary();
    fireEvent.click(screen.getByRole('button', { name: /conferma ordine/i }));

    await waitFor(() => expect(store.confirmCart).toHaveBeenCalledWith('delivery', {
      address: 'Via Roma 1, Milano, 20100'
    }));
  });

  test('permette di usare un indirizzo salvato o inserirne uno nuovo', async () => {
    useAuthStore.mockReturnValue({
      user: {
        id: 'c1',
        name: 'Luca',
        role: 'customer',
        address: { street: 'Via Verdi 2', city: 'Milano', zip: '20100' }
      },
      isAuthenticated: true
    });
    await renderPage();

    fireEvent.click(screen.getByRole('radio', { name: /consegna a domicilio/i }));
    expect(screen.getByRole('tab', { name: /indirizzo salvato/i })).toHaveTextContent('Via Verdi 2, Milano, 20100');
    expect(screen.queryByLabelText('via e numero')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /aggiungi nuovo indirizzo/i }));
    expect(screen.getByLabelText('via e numero')).toBeInTheDocument();
  });

  test('mostra il codice ordine dopo la conferma', async () => {
    const store = await renderPage();

    continueToPayment();
    continueToSummary();
    fireEvent.click(screen.getByRole('button', { name: /conferma ordine/i }));

    await waitFor(() => expect(store.confirmCart).toHaveBeenCalled());
    expect(await screen.findByText('FF-A1B2C3')).toBeInTheDocument();
  });

  test('non mostra il checkout a un utente non autenticato', async () => {
    useAuthStore.mockReturnValue({ user: null, isAuthenticated: false });
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    useOrderStore.mockReturnValue(storeWith());

    render(<OrderPaymentPage />);

    expect(await screen.findByText(/SESSIONE_/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /conferma ordine/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /continua a sfogliare/i }));
    expect(navigate).toHaveBeenCalledWith('/orders');
  });
});
