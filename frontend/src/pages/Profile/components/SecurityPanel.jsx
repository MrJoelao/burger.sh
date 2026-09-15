/**
 * SecurityPanel - cambio password. Chiede la nuova password due volte e non
 * invia nulla finché non coincidono, così il campo password arriva al backend
 * solo quando è valido.
 */

import { useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { useAuthStore } from '../../../state/authStore.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { passwordErrors } from '../../../domain/profile.js';
import { Panel } from './Panel.jsx';
import { ProfileField } from './ProfileField.jsx';
import { Feedback, feedbackFrom } from './Feedback.jsx';

const EMPTY = { password: '', confirmPassword: '' };

export function SecurityPanel() {
  const { updateProfile } = useAuthStore();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const setField = (name, value) => {
    setValues(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const nextErrors = passwordErrors(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    setFeedback(null);

    const result = await updateProfile({ password: values.password });

    if (result?.success) setValues(EMPTY);
    setFeedback(feedbackFrom(result, 'password aggiornata', 'impossibile aggiornare la password'));
    setBusy(false);
  };

  const field = (name, label) => html`
    <${ProfileField} key=${name} label=${label} error=${errors[name]}>
      <input
        type="password"
        autocomplete="new-password"
        value=${values[name]}
        onInput=${event => setField(name, event.currentTarget.value)}
        aria-invalid=${Boolean(errors[name])}
      />
    <//>
  `;

  return html`
    <${Panel} id="sicurezza" eyebrow="accesso" title="SICUREZZA_" titleSpan="ACCOUNT">
      <form class="profile-form" onSubmit=${submit} novalidate>
        <div class="profile-grid">
          ${field('password', 'nuova password')}
          ${field('confirmPassword', 'conferma nuova password')}
        </div>
        <${Feedback} feedback=${feedback} />
        <${TerminalButton} primary type="submit" disabled=${busy}>
          ${busy ? '[ ... ] aggiornamento' : '[ enter ] aggiorna password'}
        <//>
      </form>
    <//>
  `;
}

export default SecurityPanel;
