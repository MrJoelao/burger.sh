import { render, screen } from '@testing-library/preact';
import { CustomerShell } from './CustomerShell.jsx';

vi.mock('../../state/authStore.js', () => ({
  useAuthStore: () => ({ user: { id: 'c1', name: 'Luca', role: 'customer' } })
}));

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

describe('CustomerShell', () => {
  test('offre la directory dell area cliente, non quella operativa', () => {
    render(<CustomerShell><p>contenuto</p></CustomerShell>);

    expect(screen.getByText('contenuto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pagamenti/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ordini/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /profilo/i })).toBeInTheDocument();
  });

  test('firma la striscia identità con il cliente in sessione', () => {
    render(<CustomerShell><p>contenuto</p></CustomerShell>);

    expect(screen.getByText('Luca')).toBeInTheDocument();
  });
});
