/* verifica che il wizard disponga i campi su due colonne e che l'email
   occupi tutta la larghezza, cosi da riempire il pannello largo della
   registrazione senza lasciare campi stretti in una colonna sola */

import { render, screen, fireEvent } from '@testing-library/preact';
import { RegisterWizard } from './RegisterWizard.jsx';

function renderWizard() {
  const utils = render(<RegisterWizard />);
  return { ...utils, form: utils.container.querySelector('form') };
}

function selectCustomer() {
  fireEvent.click(screen.getByText('CLIENTE').closest('button'));
}

function submitStep(form) {
  fireEvent.submit(form);
}

describe('RegisterWizard', () => {
  test('al passo identita mette nome e cognome su due colonne', () => {
    const { container, form } = renderWizard();

    selectCustomer();
    submitStep(form);

    const grid = container.querySelector('.wizard-fields.two-up');
    expect(grid).not.toBeNull();
    expect(grid.querySelectorAll('.wizard-field')).toHaveLength(2);
  });

  test('al passo credenziali l\'email occupa tutta la larghezza', () => {
    const { container, form } = renderWizard();

    selectCustomer();
    submitStep(form);

    fireEvent.input(screen.getByLabelText('nome'), { target: { value: 'Mario' } });
    fireEvent.input(screen.getByLabelText('cognome'), { target: { value: 'Rossi' } });
    submitStep(form);

    expect(screen.getByLabelText('email').closest('.wizard-field')).toHaveClass('wide');
    expect(container.querySelectorAll('.wizard-fields.two-up')).toHaveLength(1);
  });
});
