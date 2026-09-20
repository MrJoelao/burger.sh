/* verifica il contratto di layout dell'accesso: l'aside laterale vive solo
   nel login, mentre la registrazione collassa a una colonna a tutta
   larghezza cosi il wizard usa tutto lo spazio disponibile */

import { render, screen } from '@testing-library/preact';
import { AuthLayout } from './AuthLayout.jsx';

function renderLayout(mode) {
  return render(<AuthLayout mode={mode} onSubmit={() => {}} onSwitchMode={() => {}} />);
}

describe('AuthLayout', () => {
  describe('login', () => {
    test('mostra l\'aside laterale', () => {
      renderLayout('login');

      expect(screen.getByRole('complementary')).toBeInTheDocument();
    });

    test('resta sul layout a due colonne', () => {
      const { container } = renderLayout('login');

      expect(container.querySelector('.access-layout')).not.toHaveClass('register-layout');
    });
  });

  describe('register', () => {
    test('nasconde l\'aside laterale', () => {
      renderLayout('register');

      expect(screen.queryByRole('complementary')).toBeNull();
    });

    test('usa il layout a tutta larghezza', () => {
      const { container } = renderLayout('register');

      expect(container.querySelector('.access-layout')).toHaveClass('register-layout');
    });

    test('monta comunque il pannello del wizard', () => {
      renderLayout('register');

      expect(screen.getByRole('heading', { name: 'SCEGLI IL TUO RUOLO.' })).toBeInTheDocument();
    });
  });
});
