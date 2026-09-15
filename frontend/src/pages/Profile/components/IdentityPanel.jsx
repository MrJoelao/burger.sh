/**
 * IdentityPanel - dati anagrafici: nome, cognome, email. Salva solo i campi
 * anagrafici, così una modifica qui non tocca indirizzo o preferenze.
 */

import { useEffect, useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { useAuthStore } from '../../../state/authStore.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { IDENTITY_FIELDS } from '../../../domain/profile.js';
import { Panel } from './Panel.jsx';
import { ProfileField } from './ProfileField.jsx';
import { Feedback, feedbackFrom } from './Feedback.jsx';

function identityValues(user) {
  return {
    name: user?.name || '',
    surname: user?.surname || '',
    email: user?.email || ''
  };
}

export function IdentityPanel({ active = true }) {
  const { user, updateProfile } = useAuthStore();
  const [values, setValues] = useState(() => identityValues(user));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => { setValues(identityValues(user)); }, [user]);

  const setField = (name, value) => setValues(previous => ({ ...previous, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    const result = await updateProfile(identityValues({ ...user, ...values }));

    setFeedback(feedbackFrom(result, 'dati anagrafici aggiornati', 'impossibile aggiornare i dati'));
    setBusy(false);
  };

  return html`
    <${Panel} id="anagrafica" eyebrow="identità" title="DATI_" titleSpan="ANAGRAFICA" active=${active}>
      <form class="profile-form" onSubmit=${submit}>
        <div class="profile-grid">
          ${IDENTITY_FIELDS.map(field => html`
            <${ProfileField} key=${field.name} label=${field.label}>
              <input
                type=${field.type || 'text'}
                autocomplete=${field.autocomplete}
                value=${values[field.name] || ''}
                onInput=${event => setField(field.name, event.currentTarget.value)}
              />
            <//>
          `)}
        </div>
        <${Feedback} feedback=${feedback} />
        <${TerminalButton} primary type="submit" disabled=${busy}>
          ${busy ? '[ ... ] salvataggio' : '[ enter ] salva anagrafica'}
        <//>
      </form>
    <//>
  `;
}

export default IdentityPanel;
