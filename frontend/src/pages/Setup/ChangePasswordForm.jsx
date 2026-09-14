/**
 * ChangePasswordForm - forced first-login password change
 * chiede sempre la password attuale prima di impostare quella nuova
 */

import { useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';

const INITIAL = { currentPassword: '', newPassword: '', confirmPassword: '' };

function validate(values) {
  const errors = {};

  if (!values.currentPassword) errors.currentPassword = 'Password attuale richiesta';
  if (!values.newPassword) errors.newPassword = 'Nuova password richiesta';
  else if (values.newPassword.length < 6) errors.newPassword = 'Almeno 6 caratteri';
  if (values.newPassword !== values.confirmPassword) errors.confirmPassword = 'Le password non coincidono';

  return errors;
}

export function ChangePasswordForm({ onSubmit = () => {}, loading = false, error = '' }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const update = (field, value) => {
    setValues(previous => ({ ...previous, [field]: value }));
    if (errors[field]) setErrors(previous => ({ ...previous, [field]: '' }));
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSubmit({ currentPassword: values.currentPassword, newPassword: values.newPassword });
  };

  const field = (name, label, autocomplete) => html`
    <div class="wizard-field">
      <label>
        ${label}
        <input
          type="password"
          name=${name}
          autocomplete=${autocomplete}
          value=${values[name]}
          onInput=${event => update(name, event.currentTarget.value)}
          aria-invalid=${Boolean(errors[name])}
          aria-describedby=${errors[name] ? `${name}-error` : undefined}
        />
      </label>
      ${errors[name] && html`<span class="form-message" id=${`${name}-error`}>${errors[name]}</span>`}
    </div>
  `;

  return html`
    <form class="auth-form change-password-form" onSubmit=${submit} novalidate>
      ${field('currentPassword', 'password attuale', 'current-password')}
      ${field('newPassword', 'nuova password', 'new-password')}
      ${field('confirmPassword', 'conferma nuova password', 'new-password')}

      ${error && html`<p class="form-message" aria-live="polite">${error}</p>`}

      <${TerminalButton} primary type="submit" disabled=${loading}>
        [ enter ] aggiorna password
      <//>
    </form>
  `;
}

export default ChangePasswordForm;
