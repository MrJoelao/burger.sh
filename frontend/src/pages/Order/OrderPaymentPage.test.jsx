import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { OrderPaymentPage } from './OrderPaymentPage.jsx';
import { paymentService } from '../../services/paymentService.js';
import { navigate } from '../../router/navigate.js';
import { useOrderStore } from '../../state/orderStore.js';
import { useAuthStore } from '../../state/authStore.js';

vi.mock('../../state/authStore.js', () => {
  const useAuthStore = vi.fn(() => ({ user: { id: 'c1', name: 'Luca', role: 'customer' }, isAuthenticated: true }));
  return { useAuthStore };
});

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

vi.mock('../../services/paymentService.js', () => ({
  paymentService: { list: vi.fn(), create: vi.fn() }
}));

vi.mock('../../state/orderStore.js', () => ({ useOrderStore: vi.fn() }));

const CARD = { _id: 'p1', type: 'card', label: 'Carta di Mario Rossi', details: '4242', isDefault: true };

const ITEMS = [{ dishId: 'd1', name: 'Cheeseburger', price: 6.5, quantity: 2 }];

function storeWith(overrides = {}) {
  return {
    items: ITEMS,
    confirmCart: vi.fn().mockResolvedValue({ success: true, data: { _id: 'o9', orderCode: 'FF-A1B2C3' } }),
    fetchCart: vi.fn().mockResolvedValue(null),
    ...overrides
  };
}

function fillNewCard() {
  fireEvent.input(screen.getByLabelText('nome intestatario'), { target: { value: 'Mario' } });
  fireEvent.input(screen.getByLabelText('cognome intestatario'), { target: { value: 'Rossi' } });
  fireEvent.input(screen.getByLabelText('numero carta'), { target: { value: '4242 4242 4242 4242' } });
  fireEvent.input(screen.getByLabelText('scadenza'), { target: { value: '12/29' } });
  fireEvent.input(screen.getByLabelText('cvv'), { target: { value: '123' } });
}

describe('OrderPaymentPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('riassume il carrello e propone il pagamento alla cassa come opzione', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    useOrderStore.mockReturnValue(storeWith());

    render(<OrderPaymentPage />);

    expect(await screen.findByText('Cheeseburger')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /pagamento alla cassa/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /paypal/i })).toBeInTheDocument();
  });

  test('conferma un ritiro con pagamento alla cassa senza salvare nulla', async () => {
    const store = storeWith();
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    useOrderStore.mockReturnValue(store);

    render(<OrderPaymentPage />);
    await screen.findByText('Cheeseburger');

    fireEvent.click(screen.getByRole('button', { name: /conferma e paga/i }));

    await waitFor(() => expect(store.confirmCart).toHaveBeenCalledWith('pickup', undefined));
    expect(paymentService.create).not.toHaveBeenCalled();
  });

  test('mostra il codice dell ordine alla conferma', async () => {
    const store = storeWith();
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    useOrderStore.mockReturnValue(store);

    render(<OrderPaymentPage />);
    await screen.findByText('Cheeseburger');
    fireEvent.click(screen.getByRole('button', { name: /conferma e paga/i }));

    expect(await screen.findByText('FF-A1B2C3')).toBeInTheDocument();
    expect(screen.getByText(/pagamento simulato/i)).toBeInTheDocument();
  });

  test('una consegna a domicilio richiede l indirizzo', async () => {
    const store = storeWith();
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    useOrderStore.mockReturnValue(store);

    render(<OrderPaymentPage />);
    await screen.findByText('Cheeseburger');

    fireEvent.click(screen.getByRole('button', { name: /consegna/i }));
    fireEvent.click(screen.getByRole('button', { name: /conferma e paga/i }));

    expect(await screen.findByText(/completa via, città e cap/i)).toBeInTheDocument();
    expect(store.confirmCart).not.toHaveBeenCalled();
  });

  test('una nuova carta viene salvata con le sole ultime cifre e poi conferma', async () => {
    const store = storeWith();
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    paymentService.create.mockResolvedValue({ success: true, data: CARD });
    useOrderStore.mockReturnValue(store);

    render(<OrderPaymentPage />);
    await screen.findByText('Cheeseburger');

    fireEvent.click(screen.getByRole('radio', { name: /nuova carta/i }));
    fillNewCard();
    fireEvent.click(screen.getByRole('button', { name: /conferma e paga/i }));

    await waitFor(() => {
      expect(paymentService.create).toHaveBeenCalledWith({
        type: 'card',
        label: 'Carta di Mario Rossi',
        details: '4242',
        isDefault: false
      });
      expect(store.confirmCart).toHaveBeenCalledWith('pickup', undefined);
    });
  });

  test('una carta salvata evita il salvataggio e conferma il carrello', async () => {
    const store = storeWith();
    paymentService.list.mockResolvedValue({ success: true, data: [CARD] });
    useOrderStore.mockReturnValue(store);

    render(<OrderPaymentPage />);
    await screen.findByText('Cheeseburger');

    fireEvent.click(screen.getByRole('radio', { name: /carta salvata/i }));
    fireEvent.click(screen.getByRole('radio', { name: /•••• 4242/i }));
    fireEvent.click(screen.getByRole('button', { name: /conferma e paga/i }));

    await waitFor(() => expect(store.confirmCart).toHaveBeenCalled());
    expect(paymentService.create).not.toHaveBeenCalled();
  });

  test('una consegna con indirizzo invia mode e indirizzo', async () => {
    const store = storeWith();
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    useOrderStore.mockReturnValue(store);

    render(<OrderPaymentPage />);
    await screen.findByText('Cheeseburger');

    fireEvent.click(screen.getByRole('button', { name: /consegna/i }));
    fireEvent.input(screen.getByLabelText('via e numero'), { target: { value: 'Via Roma 1' } });
    fireEvent.input(screen.getByLabelText('città'), { target: { value: 'Milano' } });
    fireEvent.input(screen.getByLabelText('cap'), { target: { value: '20100' } });
    fireEvent.click(screen.getByRole('button', { name: /conferma e paga/i }));

    await waitFor(() => expect(store.confirmCart).toHaveBeenCalledWith('delivery', { address: 'Via Roma 1, Milano 20100' }));
  });

  test('un carrello vuoto non porta alla conferma', async () => {
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    useOrderStore.mockReturnValue(storeWith({ items: [] }));

    render(<OrderPaymentPage />);

    expect(await screen.findByText(/carrello è vuoto/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /conferma e paga/i })).not.toBeInTheDocument();
  });

  test('mostra modal auth quando utente non autenticato arriva al pagamento', async () => {
    useAuthStore.mockReturnValue({ user: null, isAuthenticated: false });
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    useOrderStore.mockReturnValue(storeWith());

    render(<OrderPaymentPage />);

    expect(await screen.findByText(/SESSIONE_/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /conferma e paga/i })).not.toBeInTheDocument();
  });

  test('chiudendo il modal auth reindirizza alla selezione filiale', async () => {
    useAuthStore.mockReturnValue({ user: null, isAuthenticated: false });
    paymentService.list.mockResolvedValue({ success: true, data: [] });
    useOrderStore.mockReturnValue(storeWith());

    render(<OrderPaymentPage />);
    fireEvent.click(screen.getByRole('button', { name: /continua a sfogliare/i }));

    expect(navigate).toHaveBeenCalledWith('/orders');
  });
});