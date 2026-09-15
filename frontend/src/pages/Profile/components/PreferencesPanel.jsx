/**
 * PreferencesPanel - preferenze alimentari e d'acquisto del cliente. Le
 * checkbox sono raggruppate per famiglia invece di stare in un blocco unico.
 */

import { useEffect, useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { useAuthStore } from '../../../state/authStore.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { PREFERENCE_GROUPS, preferenceLabel } from '../../../domain/profile.js';
import { Panel } from './Panel.jsx';
import { Feedback, feedbackFrom } from './Feedback.jsx';

export function PreferencesPanel() {
  const { user, updateProfile } = useAuthStore();
  const [selected, setSelected] = useState(() => user?.preferences || []);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => { setSelected(user?.preferences || []); }, [user]);

  const toggle = (value) => setSelected(previous => previous.includes(value)
    ? previous.filter(item => item !== value)
    : [...previous, value]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFeedback(null);

    const result = await updateProfile({ preferences: selected });

    setFeedback(feedbackFrom(result, 'preferenze aggiornate', 'impossibile aggiornare le preferenze'));
    setBusy(false);
  };

  return html`
    <${Panel} id="preferenze" eyebrow="gusti" title="PREFERENZE_" titleSpan="ALIMENTARI">
      <form class="profile-form" onSubmit=${submit}>
        <div class="profile-preferences">
          ${PREFERENCE_GROUPS.map(group => html`
            <div class="profile-preference-group" key=${group.key} role="group" aria-label=${group.label}>
              <p class="eyebrow">${group.label}</p>
              <div class="profile-preference-row">
                ${group.values.map(value => html`
                  <label class="profile-preference" key=${value}>
                    <input
                      type="checkbox"
                      checked=${selected.includes(value)}
                      onChange=${() => toggle(value)}
                    />
                    ${preferenceLabel(value)}
                  </label>
                `)}
              </div>
            </div>
          `)}
        </div>
        <${Feedback} feedback=${feedback} />
        <${TerminalButton} primary type="submit" disabled=${busy}>
          ${busy ? '[ ... ] salvataggio' : '[ enter ] salva preferenze'}
        <//>
      </form>
    <//>
  `;
}

export default PreferencesPanel;
