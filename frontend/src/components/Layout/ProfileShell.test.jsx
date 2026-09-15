/* la cornice del profilo: terminale, senza la directory operativa delle altre
   console. i collegamenti in alto riportano nell'area del proprio ruolo */

import { render, screen, within } from '@testing-library/preact';
import { ProfileShell } from './ProfileShell.jsx';
import { useAuthStore } from '../../state/authStore.js';

vi.mock('../../state/authStore.js', () => ({ useAuthStore: vi.fn() }));

function storeWith(user) {
  return { user };
}

function navLabels() {
  const nav = screen.getByRole('navigation', { name: 'Navigazione principale' });
  return within(nav).getAllByRole('link').map(link => link.textContent);
}

describe('ProfileShell', () => {
  test('l’admin ritrova i collegamenti della sua console', () => {
    useAuthStore.mockReturnValue(storeWith({ role: 'admin', name: 'Joel' }));
    render(<ProfileShell><p>contenuto</p></ProfileShell>);

    expect(navLabels()).toEqual(['dashboard', 'utenti', 'filiali', 'statistiche', 'profilo']);
  });

  test('il cliente ritrova i collegamenti del negozio', () => {
    useAuthStore.mockReturnValue(storeWith({ role: 'customer', name: 'Luca' }));
    render(<ProfileShell><p>contenuto</p></ProfileShell>);

    expect(navLabels()).toEqual(['ordina', 'ordini', 'profilo']);
  });

  test('non espone la directory operativa né la barra access granted', () => {
    useAuthStore.mockReturnValue(storeWith({ role: 'manager', name: 'Joel' }));
    render(<ProfileShell><p>contenuto</p></ProfileShell>);

    expect(document.querySelector('.command-list')).toBeNull();
    expect(document.querySelector('.workspace-head')).toBeNull();
    expect(screen.queryByText(/granted/i)).not.toBeInTheDocument();
  });

  test('mostra il contenuto e il nome dell’utente', () => {
    useAuthStore.mockReturnValue(storeWith({ role: 'customer', name: 'Luca' }));
    render(<ProfileShell><p>contenuto profilo</p></ProfileShell>);

    expect(screen.getByText('contenuto profilo')).toBeInTheDocument();
    expect(screen.getByText('Luca')).toBeInTheDocument();
  });
});
