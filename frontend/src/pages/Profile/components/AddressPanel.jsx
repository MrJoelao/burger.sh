/**
 * AddressPanel - indirizzo di consegna. Salva l'intero oggetto address, che è
 * il campo previsto da PUT /users/me.
 */

import { useEffect, useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { useAuthStore } from '../../../state/authStore.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { ADDRESS_FIELDS } from '../../../domain/profile.js';
import { Panel } from './Panel.jsx';
import { ProfileField } from './ProfileField.jsx';
import { Feedback, feedbackFrom } from './Feedback.jsx';

function addressValues(user) {
  return {
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    zip: user?.address?.zip || ''
  };
}

export function AddressPanel() {
  const { user, updateProfile } = useAuthStore();
  const [values, setValues] = useState(() => addressValues(user));
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => { setValues(addressValues(user)); }, [user]);

  const setField = (name, value) => setValues(previous => ({ ...previous, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    const result = await updateProfile({ address: addressValues({ address: values }) });

    setFeedback(feedbackFrom(result, 'indirizzo aggiornato', 'impossibile aggiornare l’indirizzo'));
    setBusy(false);
  };

  return html`
    <${Panel} id="indirizzo" eyebrow="recapito" title="INDIRIZZO_" titleSpan="DI CONSEGNA">
      <form class="profile-form" onSubmit=${submit}>
        <div class="profile-grid">
          ${ADDRESS_FIELDS.map(field => html`
            <${ProfileField} key=${field.name} label=${field.label}>
              <input
                autocomplete=${field.autocomplete}
                value=${values[field.name] || ''}
                onInput=${event => setField(field.name, event.currentTarget.value)}
              />
            <//>
          `)}
        </div>
        <${Feedback} feedback=${feedback} />
        <${TerminalButton} primary type="submit" disabled=${busy}>
          ${busy ? '[ ... ] salvataggio' : '[ enter ] salva indirizzo'}
        <//>
      </form>
    <//>
  `;
}

export default AddressPanel;
