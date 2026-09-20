/* il cambio password forzato richiede sempre la password attuale e una nuova
   password confermata, poi delega al backend tramite onSubmit */

import { render, screen, fireEvent } from '@testing-library/preact';
import { ChangePasswordForm } from './ChangePasswordForm.jsx';

function renderForm(props = {}) {
  const onSubmit = vi.fn();
  const utils = render(<ChangePasswordForm onSubmit={onSubmit} {...props} />);
  return { ...utils, onSubmit, form: utils.container.querySelector('form') };
}

const submit = (form) => fireEvent.submit(form);

describe('ChangePasswordForm', () => {
  test('richiede la password attuale', () => {
    const { form } = renderForm();

    submit(form);

    expect(screen.getByText('Password attuale richiesta')).toBeInTheDocument();
  });

  test('richiede una nuova password di almeno 6 caratteri', () => {
    const { form } = renderForm();

    fireEvent.input(screen.getByLabelText('password attuale'), { target: { value: 'provvisoria' } });
    fireEvent.input(screen.getByLabelText('nuova password'), { target: { value: '123' } });
    submit(form);

    expect(screen.getByText('Almeno 6 caratteri')).toBeInTheDocument();
  });

  test('segnala quando la conferma non coincide', () => {
    const { form } = renderForm();

    fireEvent.input(screen.getByLabelText('password attuale'), { target: { value: 'provvisoria' } });
    fireEvent.input(screen.getByLabelText('nuova password'), { target: { value: 'nuovaPassword1' } });
    fireEvent.input(screen.getByLabelText('conferma nuova password'), { target: { value: 'diversa' } });
    submit(form);

    expect(screen.getByText('Le password non coincidono')).toBeInTheDocument();
  });

  test('invia password attuale e nuova password', () => {
    const { form, onSubmit } = renderForm();

    fireEvent.input(screen.getByLabelText('password attuale'), { target: { value: 'provvisoria' } });
    fireEvent.input(screen.getByLabelText('nuova password'), { target: { value: 'nuovaPassword1' } });
    fireEvent.input(screen.getByLabelText('conferma nuova password'), { target: { value: 'nuovaPassword1' } });
    submit(form);

    expect(onSubmit).toHaveBeenCalledWith({
      currentPassword: 'provvisoria',
      newPassword: 'nuovaPassword1'
    });
  });
});
