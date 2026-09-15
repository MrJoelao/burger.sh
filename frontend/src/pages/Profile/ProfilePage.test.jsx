import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ProfilePage } from './ProfilePage.jsx';
import { useAuthStore } from '../../state/authStore.js';
import { restaurantService } from '../../services/restaurantService.js';
import { navigate } from '../../router/navigate.js';

vi.mock('../../state/authStore.js', () => ({ useAuthStore: vi.fn() }));
vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));
vi.mock('../../services/restaurantService.js', () => ({
  restaurantService: { getRestaurants: vi.fn() }
}));

function storeWith(user, overrides = {}) {
  return {
    user,
    updateProfile: vi.fn().mockResolvedValue({ success: true, data: user }),
    deleteAccount: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn(),
    ...overrides
  };
}

const CUSTOMER = { id: 'c1', role: 'customer', name: 'Luca', surname: 'B', email: 'luca@x.it', preferences: [] };
const MANAGER = { id: 'm1', role: 'manager', name: 'Joel', surname: 'Stephan', email: 'joel@manager.com', managerStatus: 'pending' };

const BRANCHES = [
  { _id: 'r1', name: 'Bergamo', managerId: { id: 'm1', name: 'Joel', surname: 'Stephan' } },
  { _id: 'r2', name: 'Milano', managerId: { id: 'm9', name: 'Ada', surname: 'Lovelace' } }
];

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: [] });
  });

  test('il cliente vede la sezione preferenze', async () => {
    useAuthStore.mockReturnValue(storeWith(CUSTOMER));
    render(<ProfilePage />);

    expect(await screen.findByRole('link', { name: /preferenze/i })).toBeInTheDocument();
  });

  test('il manager non vede le preferenze ma vede lo stato di approvazione', async () => {
    useAuthStore.mockReturnValue(storeWith(MANAGER));
    render(<ProfilePage />);

    await screen.findByRole('link', { name: /account/i });
    expect(screen.queryByRole('link', { name: /preferenze/i })).not.toBeInTheDocument();
    expect(screen.getByText('in attesa')).toBeInTheDocument();
  });

  test('il cliente non interroga le filiali', async () => {
    useAuthStore.mockReturnValue(storeWith(CUSTOMER));
    render(<ProfilePage />);

    await screen.findByRole('link', { name: /anagrafica/i });
    expect(restaurantService.getRestaurants).not.toHaveBeenCalled();
  });

  test('salva l\'anagrafica con i soli campi anagrafici', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    fireEvent.input(await screen.findByLabelText('nome'), { target: { value: 'Lucia' } });
    fireEvent.click(screen.getByRole('button', { name: /salva anagrafica/i }));

    await waitFor(() => expect(store.updateProfile).toHaveBeenCalledWith({
      name: 'Lucia',
      surname: 'B',
      email: 'luca@x.it'
    }));
  });

  test('salva l\'indirizzo di consegna', async () => {
    const store = storeWith({ ...CUSTOMER, address: { street: 'Via Roma 1', city: 'Milano', zip: '20100' } });
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    fireEvent.input(await screen.findByLabelText('via'), { target: { value: 'Via Verdi 2' } });
    fireEvent.click(screen.getByRole('button', { name: /salva indirizzo/i }));

    await waitFor(() => expect(store.updateProfile).toHaveBeenCalledWith({
      address: { street: 'Via Verdi 2', city: 'Milano', zip: '20100' }
    }));
  });

  test('salva le preferenze selezionate', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    fireEvent.click(await screen.findByLabelText('vegetariano'));
    fireEvent.click(screen.getByRole('button', { name: /salva preferenze/i }));

    await waitFor(() => expect(store.updateProfile).toHaveBeenCalledWith({ preferences: ['vegetariano'] }));
  });

  test('non salva la password quando la conferma non coincide', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    fireEvent.input(await screen.findByLabelText('nuova password'), { target: { value: 'segreta' } });
    fireEvent.input(screen.getByLabelText('conferma nuova password'), { target: { value: 'diversa' } });
    fireEvent.click(screen.getByRole('button', { name: /aggiorna password/i }));

    expect(await screen.findByText(/non coincidono/i)).toBeInTheDocument();
    expect(store.updateProfile).not.toHaveBeenCalled();
  });

  test('salva la nuova password quando è valida', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    fireEvent.input(await screen.findByLabelText('nuova password'), { target: { value: 'segreta' } });
    fireEvent.input(screen.getByLabelText('conferma nuova password'), { target: { value: 'segreta' } });
    fireEvent.click(screen.getByRole('button', { name: /aggiorna password/i }));

    await waitFor(() => expect(store.updateProfile).toHaveBeenCalledWith({ password: 'segreta' }));
  });

  test('esce dall\'account e torna alla home', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: /esci/i }));

    expect(store.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('elimina l\'account solo dopo la conferma', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: /elimina account/i }));
    expect(store.deleteAccount).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => expect(store.deleteAccount).toHaveBeenCalledWith({}));
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('il manager con filiali non può eliminare senza scegliere un subentrante', async () => {
    useAuthStore.mockReturnValue(storeWith(MANAGER));
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: BRANCHES });
    render(<ProfilePage />);

    await screen.findByText('Bergamo');
    expect(screen.getByRole('button', { name: /elimina account/i })).toBeDisabled();
  });

  test('il manager con filiali trasferisce a un subentrante eliminando l\'account', async () => {
    const store = storeWith(MANAGER);
    useAuthStore.mockReturnValue(store);
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: BRANCHES });
    render(<ProfilePage />);

    await screen.findByText('Bergamo');
    fireEvent.change(screen.getByLabelText(/manager subentrante/i), { target: { value: 'm9' } });
    fireEvent.click(screen.getByRole('button', { name: /elimina account/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => expect(store.deleteAccount).toHaveBeenCalledWith({ newManagerId: 'm9' }));
  });

  test('il manager con filiali può scegliere di chiuderle', async () => {
    const store = storeWith(MANAGER);
    useAuthStore.mockReturnValue(store);
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: BRANCHES });
    render(<ProfilePage />);

    await screen.findByText('Bergamo');
    fireEvent.change(screen.getByLabelText(/gestione filiali/i), { target: { value: 'chiudi' } });
    fireEvent.click(screen.getByRole('button', { name: /elimina account/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => expect(store.deleteAccount).toHaveBeenCalledWith({}));
  });

  test('se l\'eliminazione fallisce mostra l\'errore e resta sulla pagina', async () => {
    const store = storeWith(CUSTOMER, {
      deleteAccount: vi.fn().mockResolvedValue({ success: false, message: 'operazione non consentita' })
    });
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    fireEvent.click(await screen.findByRole('button', { name: /elimina account/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    expect(await screen.findByText(/operazione non consentita/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
