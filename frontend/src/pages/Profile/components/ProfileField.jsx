/**
 * ProfileField - etichetta sopra il campo, messaggio sotto. L'input resta
 * dentro il label così l'etichetta è accessibile senza id espliciti.
 */

import { html } from '../../../utils/htm.js';

export function ProfileField({ label, hint = '', error = '', children }) {
  return html`
    <div class="profile-field">
      <label>
        ${label}
        ${children}
      </label>
      ${error
        ? html`<span class="profile-field-help error">${error}</span>`
        : hint && html`<span class="profile-field-help">${hint}</span>`}
    </div>
  `;
}

export default ProfileField;
