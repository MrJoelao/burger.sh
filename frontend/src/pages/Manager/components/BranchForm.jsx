/**
 * BranchForm - anagrafica della filiale modificabile dal manager. I campi e i
 * vincoli vengono da domain/branch.js, quindi restano allineati a
 * UpdateRestaurantRequest senza duplicare le regole qui.
 */

import { useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { BRANCH_FIELDS, branchErrors, branchForm, branchPayload } from '../../../domain/branch.js';

export function BranchForm({ branch = {}, busy = false, onSubmit }) {
  const [form, setForm] = useState(() => branchForm(branch));
  const [errors, setErrors] = useState({});

  const setField = (name, value) => setForm(previous => ({ ...previous, [name]: value }));

  const submit = (event) => {
    event.preventDefault();

    const found = branchErrors(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit(branchPayload(form));
  };

  return html`
    <form class="profile-form" onSubmit=${submit} novalidate>
      <div class="profile-grid">
        ${BRANCH_FIELDS.map(field => html`
          <div class="profile-field" key=${field.name}>
            <label>
              ${field.label}
              <input
                type="text"
                value=${form[field.name]}
                onInput=${event => setField(field.name, event.currentTarget.value)}
              />
            </label>
            ${errors[field.name] && html`<span class="profile-field-help error">${errors[field.name]}</span>`}
          </div>
        `)}
      </div>

      <${TerminalButton} primary type="submit" disabled=${busy}>
        ${busy ? '[ ... ] salvataggio' : '[ enter ] salva sede'}
      <//>
    </form>
  `;
}

export default BranchForm;
