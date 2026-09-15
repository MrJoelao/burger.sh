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

  /* il CSS fissa la console allo schermo con una colonna flex: se cambia la
     struttura qui sotto, quegli stili smettono di applicarsi in silenzio */
  test('tiene titlebar, schermata e footer figli diretti della console', () => {
    useAuthStore.mockReturnValue(storeWith({ role: 'manager', name: 'Joel' }));
    const { container } = render(<ProfileShell><p>contenuto</p></ProfileShell>);

    const console_ = container.querySelector('main.console');
    expect(console_).toHaveClass('profile-console');
    expect(console_.querySelector(':scope > .titlebar')).not.toBeNull();
    expect(console_.querySelector(':scope > .identity-strip')).not.toBeNull();
    expect(console_.querySelector(':scope > .profile-screen')).not.toBeNull();
    expect(console_.querySelector(':scope > .footer-status')).not.toBeNull();
  });
});
