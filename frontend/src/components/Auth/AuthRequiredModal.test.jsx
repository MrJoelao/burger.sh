/**
 * Test per AuthRequiredModal
 */

import { render, screen, fireEvent } from '@testing-library/preact';
import { html } from '../../utils/htm.js';
import { AuthRequiredModal } from './AuthRequiredModal.jsx';
import { navigate } from '../../router/navigate.js';

vi.mock('../../router/navigate.js', () => ({ navigate: vi.fn() }));

describe('AuthRequiredModal', () => {
  test('mostra il messaggio e i pulsanti', () => {
    render(html`<${AuthRequiredModal} />`);

    expect(screen.getByText(/SESSIONE_/i)).toBeInTheDocument();
    expect(screen.getByText(/NECESSARIA/i)).toBeInTheDocument();
    expect(screen.getByText(/per ordinare devi avere un account attivo/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accedi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrati/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continua a sfogliare/i })).toBeInTheDocument();
  });

  test('chiudendo con continua a sfogliare chiama onDismiss', () => {
    const onDismiss = vi.fn();
    render(html`<${AuthRequiredModal} onDismiss=${onDismiss} />`);

    fireEvent.click(screen.getByRole('button', { name: /continua a sfogliare/i }));
    expect(onDismiss).toHaveBeenCalled();
  });

  test('il pulsante accedi reindirizza a /auth', () => {
    render(html`<${AuthRequiredModal} />`);

    fireEvent.click(screen.getByRole('button', { name: /accedi/i }));
    expect(navigate).toHaveBeenCalledWith('/auth');
  });

  test('il pulsante registrati reindirizza a /auth', () => {
    render(html`<${AuthRequiredModal} />`);

    fireEvent.click(screen.getByRole('button', { name: /registrati/i }));
    expect(navigate).toHaveBeenCalledWith('/auth');
  });
});
