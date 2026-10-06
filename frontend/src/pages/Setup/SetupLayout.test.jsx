/* il setup deve vivere in un guscio dedicato a tutta schermata, non dentro
   quello dell'ordine (identity strip, sidebar comandi, shift bar); la
   sequenza di boot è opzionale e va richiesta esplicitamente */

import { render, screen } from '@testing-library/preact';
import { SetupLayout } from './SetupLayout.jsx';

describe('SetupLayout', () => {
  test('usa il guscio setup e non quello dell\'ordine', () => {
    const { container } = render(<SetupLayout><p>contenuto</p></SetupLayout>);

    expect(container.querySelector('main.setup-console')).not.toBeNull();
    expect(container.querySelector('.command-list')).toBeNull();
    expect(screen.queryByText('nuovo ordine')).toBeNull();
  });

  test('mostra il contenuto ricevuto nel pannello', () => {
    render(<SetupLayout><p>contenuto setup</p></SetupLayout>);

    expect(screen.getByText('contenuto setup')).toBeInTheDocument();
  });

  test('non espone la navigazione dell\'ordine', () => {
    render(<SetupLayout><p>x</p></SetupLayout>);

    expect(screen.queryByRole('link', { name: 'ordina' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'accedi' })).toBeNull();
  });

  test('di default non mostra la sequenza di boot', () => {
    const { container } = render(<SetupLayout><p>x</p></SetupLayout>);

    expect(container.querySelector('.setup-boot')).toBeNull();
  });

  test('con boot mostra una sequenza di boot ricca di dettagli', () => {
    const { container } = render(<SetupLayout boot><p>x</p></SetupLayout>);

    expect(container.querySelector('.setup-boot')).not.toBeNull();
    expect(container.querySelectorAll('.setup-boot-log span').length).toBeGreaterThanOrEqual(6);
    expect(container.querySelector('.setup-boot-track')).not.toBeNull();
  });

  test('scagliona le righe di boot con un indice progressivo', () => {
    const { container } = render(<SetupLayout boot><p>x</p></SetupLayout>);

    const lines = container.querySelectorAll('.setup-boot-log span');
    expect(lines[0].getAttribute('style')).toContain('--boot-index: 0');
    expect(lines[1].getAttribute('style')).toContain('--boot-index: 1');
  });
});
