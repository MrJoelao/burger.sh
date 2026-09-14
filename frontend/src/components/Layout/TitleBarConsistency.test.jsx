/* verifica che le barre di accesso (login) e ordine espongano
   gli stessi link nello stesso ordine, così la selezione non si sposta */

import { render, screen, within, cleanup } from '@testing-library/preact';
import { AuthLayout } from '../../pages/Auth/AuthLayout.jsx';
import { TerminalWindow } from './TerminalWindow.jsx';

function topBarLinks() {
  const nav = screen.getByRole('navigation', { name: 'Navigazione principale' });
  return within(nav).getAllByRole('link').map(link => link.textContent);
}

describe('top bar consistency', () => {
  test('access and ordering bars show the same links in the same order', () => {
    render(<AuthLayout mode="login" onSubmit={() => {}} onSwitchMode={() => {}} />);
    const accessLinks = topBarLinks();
    cleanup();

    render(<TerminalWindow>contenuto</TerminalWindow>);
    const orderingLinks = topBarLinks();

    expect(accessLinks).toEqual(orderingLinks);
  });

  test('both bars expose the standard order: ordina, accedi', () => {
    render(<AuthLayout mode="login" onSubmit={() => {}} onSwitchMode={() => {}} />);

    expect(topBarLinks()).toEqual(['ordina', 'accedi']);
  });
});
