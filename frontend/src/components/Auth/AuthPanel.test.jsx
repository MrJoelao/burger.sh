/* verifica che l'intestazione del pannello segua il passo del wizard: e il
   comportamento che il refactor di onStepChange non deve rompere */

import { render, screen, fireEvent } from '@testing-library/preact';
import { AuthPanel } from './AuthPanel.jsx';

describe('AuthPanel', () => {
  test('in register aggiorna titolo e sottotitolo a ogni passo', () => {
    const { container } = render(<AuthPanel mode="register" />);

    expect(screen.getByRole('heading', { name: 'SCEGLI IL TUO RUOLO.' })).toBeInTheDocument();
    expect(screen.getByText('Partiamo da come userai burger.sh.', { selector: '#auth-subtitle' })).toBeInTheDocument();

    fireEvent.click(screen.getByText('CLIENTE').closest('button'));
    fireEvent.submit(container.querySelector('form'));

    expect(screen.getByRole('heading', { name: 'PRESENTATI.' })).toBeInTheDocument();
    expect(screen.getByText('Un nome rende ogni ordine riconoscibile.', { selector: '#auth-subtitle' })).toBeInTheDocument();
  });

  test('in login mostra la copy di accesso', () => {
    render(<AuthPanel mode="login" />);

    expect(screen.getByRole('heading', { name: 'BENTORNATO.' })).toBeInTheDocument();
  });
});
