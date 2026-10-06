import { render, screen, within } from '@testing-library/preact';
import { CustomerShell } from './CustomerShell.jsx';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { id: 'c1', name: 'Luca', role: 'customer' } })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

describe('CustomerShell', () => {
  test('offre dashboard, ordini e profilo come opzioni, senza directory laterale', () => {
    render(<CustomerShell><p>contenuto</p></CustomerShell>);

    expect(screen.getByText('contenuto')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: 'Navigazione principale' });
    const labels = within(nav).getAllByRole('link').map(link => link.textContent);

    expect(labels).toEqual(['dashboard', 'ordini', 'profilo']);
    expect(document.querySelector('.command-list')).toBeNull();
  });

  test('firma la striscia identità con il cliente in sessione', () => {
    render(<CustomerShell><p>contenuto</p></CustomerShell>);

    expect(screen.getByText('Luca')).toBeInTheDocument();
  });

  test('nasconde la striscia identità durante il wizard d ordine', () => {
    render(<CustomerShell wizardMode><p>contenuto</p></CustomerShell>);

    expect(document.querySelector('.identity-strip')).toBeNull();
    expect(screen.queryByText(/ordina dalle filiali/i)).not.toBeInTheDocument();
  });
});