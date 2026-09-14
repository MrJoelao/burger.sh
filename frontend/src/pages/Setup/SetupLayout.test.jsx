/* il setup deve vivere in un guscio dedicato a tutta schermata, non dentro
   quello dell'ordine (identity strip, sidebar comandi, shift bar) */

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

  test('include la sequenza di boot decorativa', () => {
    const { container } = render(<SetupLayout><p>x</p></SetupLayout>);

    expect(container.querySelector('.setup-boot')).not.toBeNull();
  });
});
