/* il profilo è una schermata a sé: indice come selettore, un pannello alla
   volta. questi test descrivono prima il comportamento, poi l'implementazione */

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

/* apre una sezione dall'indice: è il modo in cui l'utente ci arriva */
function openSection(name) {
  fireEvent.click(screen.getByRole('tab', { name: new RegExp(name, 'i') }));
}

function sectionPanel(id) {
  return document.getElementById(`panel-${id}`);
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: [] });
  });

  test('è una schermata a sé: niente directory operativa né barra access granted', () => {
    useAuthStore.mockReturnValue(storeWith(MANAGER));
    render(<ProfilePage />);

    expect(screen.queryByText(/directory/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/granted/i)).not.toBeInTheDocument();
    expect(document.querySelector('.command-list')).toBeNull();
    /* la cornice del terminale resta */
    expect(screen.getByRole('link', { name: 'burger.sh' })).toBeInTheDocument();
  });

  test('mostra una sezione alla volta, scelta dall’indice', () => {
    useAuthStore.mockReturnValue(storeWith(CUSTOMER));
    render(<ProfilePage />);

    expect(screen.getAllByRole('tab')).toHaveLength(5);
    expect(screen.getByRole('tab', { name: /anagrafica/i })).toHaveAttribute('aria-selected', 'true');
    expect(sectionPanel('anagrafica')).not.toHaveAttribute('hidden');
    expect(sectionPanel('indirizzo')).toHaveAttribute('hidden');
  });

  /* la griglia che tiene indice e pannelli affiancati è agganciata a queste due
     classi: sono il perno del layout a tutta schermata */
  test('indice e pannelli stanno nella stessa area della schermata', () => {
    useAuthStore.mockReturnValue(storeWith(CUSTOMER));
    const { container } = render(<ProfilePage />);

    const screen_ = container.querySelector('.profile-screen');
    expect(screen_.querySelector(':scope > .profile-index')).not.toBeNull();
    expect(screen_.querySelector(':scope > .profile-panels')).not.toBeNull();
  });

  test('cambiare sezione non perde le modifiche non salvate', () => {
    useAuthStore.mockReturnValue(storeWith(CUSTOMER));
    render(<ProfilePage />);

    fireEvent.input(screen.getByLabelText('nome'), { target: { value: 'Lucia' } });
    openSection('indirizzo');
    expect(sectionPanel('indirizzo')).not.toHaveAttribute('hidden');
    expect(sectionPanel('anagrafica')).toHaveAttribute('hidden');

    openSection('anagrafica');
    expect(screen.getByLabelText('nome')).toHaveValue('Lucia');
  });

  test('si sposta tra le sezioni con le frecce e con fine', () => {
    useAuthStore.mockReturnValue(storeWith(CUSTOMER));
    render(<ProfilePage />);

    const first = screen.getByRole('tab', { name: /anagrafica/i });
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowDown' });

    const second = screen.getByRole('tab', { name: /indirizzo/i });
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(document.activeElement).toBe(second);

    fireEvent.keyDown(second, { key: 'End' });
    expect(screen.getByRole('tab', { name: /account/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('il pulsante di uscita resta nel pannello account', () => {
    useAuthStore.mockReturnValue(storeWith(CUSTOMER));
    render(<ProfilePage />);

    expect(screen.queryByRole('button', { name: /esci/i })).not.toBeInTheDocument();

    openSection('account');
    expect(screen.getByRole('button', { name: /esci/i })).toBeInTheDocument();
  });

  test('il cliente vede la sezione preferenze', () => {
    useAuthStore.mockReturnValue(storeWith(CUSTOMER));
    render(<ProfilePage />);

    expect(screen.getByRole('tab', { name: /preferenze/i })).toBeInTheDocument();
  });

  test('il manager non vede le preferenze ma vede lo stato di approvazione', async () => {
    useAuthStore.mockReturnValue(storeWith(MANAGER));
    render(<ProfilePage />);

    expect(screen.queryByRole('tab', { name: /preferenze/i })).not.toBeInTheDocument();

    openSection('account');
    expect(await screen.findByText('in attesa')).toBeInTheDocument();
  });

  test('il cliente non interroga le filiali', () => {
    useAuthStore.mockReturnValue(storeWith(CUSTOMER));
    render(<ProfilePage />);

    expect(screen.getByRole('tab', { name: /anagrafica/i })).toBeInTheDocument();
    expect(restaurantService.getRestaurants).not.toHaveBeenCalled();
  });

  test('salva l\'anagrafica con i soli campi anagrafici', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    fireEvent.input(screen.getByLabelText('nome'), { target: { value: 'Lucia' } });
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

    openSection('indirizzo');
    fireEvent.input(screen.getByLabelText('via'), { target: { value: 'Via Verdi 2' } });
    fireEvent.click(screen.getByRole('button', { name: /salva indirizzo/i }));

    await waitFor(() => expect(store.updateProfile).toHaveBeenCalledWith({
      address: { street: 'Via Verdi 2', city: 'Milano', zip: '20100' }
    }));
  });

  test('salva le preferenze selezionate', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    openSection('preferenze');
    fireEvent.click(screen.getByLabelText('vegetariano'));
    fireEvent.click(screen.getByRole('button', { name: /salva preferenze/i }));

    await waitFor(() => expect(store.updateProfile).toHaveBeenCalledWith({ preferences: ['vegetariano'] }));
  });

  test('non salva la password quando la conferma non coincide', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    openSection('sicurezza');
    fireEvent.input(screen.getByLabelText('nuova password'), { target: { value: 'segreta' } });
    fireEvent.input(screen.getByLabelText('conferma nuova password'), { target: { value: 'diversa' } });
    fireEvent.click(screen.getByRole('button', { name: /aggiorna password/i }));

    expect(await screen.findByText(/non coincidono/i)).toBeInTheDocument();
    expect(store.updateProfile).not.toHaveBeenCalled();
  });

  test('salva la nuova password quando è valida', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    openSection('sicurezza');
    fireEvent.input(screen.getByLabelText('nuova password'), { target: { value: 'segreta' } });
    fireEvent.input(screen.getByLabelText('conferma nuova password'), { target: { value: 'segreta' } });
    fireEvent.click(screen.getByRole('button', { name: /aggiorna password/i }));

    await waitFor(() => expect(store.updateProfile).toHaveBeenCalledWith({ password: 'segreta' }));
  });

  test('esce dall\'account e torna alla home', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    openSection('account');
    fireEvent.click(screen.getByRole('button', { name: /esci/i }));

    expect(store.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('elimina l\'account solo dopo la conferma', async () => {
    const store = storeWith(CUSTOMER);
    useAuthStore.mockReturnValue(store);
    render(<ProfilePage />);

    openSection('account');
    fireEvent.click(screen.getByRole('button', { name: /elimina account/i }));
    expect(store.deleteAccount).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    await waitFor(() => expect(store.deleteAccount).toHaveBeenCalledWith({}));
    expect(navigate).toHaveBeenCalledWith('/');
  });

  test('il manager con filiali non può eliminare senza scegliere un subentrante', async () => {
    useAuthStore.mockReturnValue(storeWith(MANAGER));
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: BRANCHES });
    render(<ProfilePage />);

    openSection('account');
    await screen.findByText('Bergamo');
    expect(screen.getByRole('button', { name: /elimina account/i })).toBeDisabled();
  });

  test('il manager con filiali trasferisce a un subentrante eliminando l\'account', async () => {
    const store = storeWith(MANAGER);
    useAuthStore.mockReturnValue(store);
    restaurantService.getRestaurants.mockResolvedValue({ success: true, data: BRANCHES });
    render(<ProfilePage />);

    openSection('account');
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

    openSection('account');
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

    openSection('account');
    fireEvent.click(screen.getByRole('button', { name: /elimina account/i }));
    fireEvent.click(screen.getByRole('button', { name: /sì/i }));

    expect(await screen.findByText(/operazione non consentita/i)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
