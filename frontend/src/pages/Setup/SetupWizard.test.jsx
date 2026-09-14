/* il wizard di setup guida in tre passi (verifica accesso, configura admin,
   riepilogo): il PIN compare solo quando serve e i dati raccolti finiscono
   nel payload inviato al backend */

import { render, screen, fireEvent } from '@testing-library/preact';
import { SetupWizard } from './SetupWizard.jsx';

function renderWizard(props = {}) {
  const onSubmit = vi.fn();
  const utils = render(<SetupWizard pinRequired={false} onSubmit={onSubmit} {...props} />);
  return { ...utils, onSubmit, form: utils.container.querySelector('form') };
}

const submit = (form) => fireEvent.submit(form);

function fillIdentity() {
  fireEvent.input(screen.getByLabelText('email'), { target: { value: 'capo@burger.sh' } });
  fireEvent.input(screen.getByLabelText('nome'), { target: { value: 'Ada' } });
  fireEvent.input(screen.getByLabelText('cognome'), { target: { value: 'Lovelace' } });
}

describe('SetupWizard', () => {
  test('elenca i tre passi nella barra di avanzamento', () => {
    const { container } = renderWizard();

    expect(container.querySelectorAll('.wizard-progress-step')).toHaveLength(3);
  });

  test('quando il PIN non serve il primo passo non chiede il pin', () => {
    renderWizard();

    expect(screen.queryByLabelText('pin dalla console backend')).toBeNull();
  });

  test('quando il PIN serve blocca il passo senza pin', () => {
    const { form } = renderWizard({ pinRequired: true });

    submit(form);

    expect(screen.getByLabelText('pin dalla console backend')).toBeInTheDocument();
    expect(screen.getByText('Inserisci il PIN stampato nella console del backend.')).toBeInTheDocument();
  });

  test('al passo identita richiede email, nome e cognome', () => {
    const { form } = renderWizard();

    submit(form); // passo 0 -> 1
    submit(form); // tenta il passo 1 vuoto

    expect(screen.getByText('Email richiesta')).toBeInTheDocument();
    expect(screen.getAllByText('Inserisci almeno 2 caratteri')).toHaveLength(2);
  });

  test('invia il payload con i dati raccolti al riepilogo', () => {
    const { form, onSubmit } = renderWizard();

    submit(form);
    fillIdentity();
    submit(form); // passo 1 -> 2 (riepilogo)

    expect(screen.getByText('capo@burger.sh')).toBeInTheDocument();

    submit(form);

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'capo@burger.sh',
      name: 'Ada',
      surname: 'Lovelace'
    });
  });

  test('include il pin e l\'indirizzo quando presenti', () => {
    const { form, onSubmit } = renderWizard({ pinRequired: true });

    fireEvent.input(screen.getByLabelText('pin dalla console backend'), { target: { value: '4821' } });
    submit(form);
    fillIdentity();
    fireEvent.input(screen.getByLabelText('via (opzionale)'), { target: { value: 'Via Roma 1' } });
    fireEvent.input(screen.getByLabelText('città (opzionale)'), { target: { value: 'Milano' } });
    fireEvent.input(screen.getByLabelText('CAP (opzionale)'), { target: { value: '20100' } });
    submit(form);
    submit(form);

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'capo@burger.sh',
      name: 'Ada',
      surname: 'Lovelace',
      address: { street: 'Via Roma 1', city: 'Milano', zip: '20100' },
      pin: '4821'
    });
  });
});
