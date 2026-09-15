/**
 * DishForm - form di un piatto custom della filiale. Serve sia a creare sia a
 * modificare: cambia solo il piatto di partenza. La validazione locale
 * rispecchia CreateDishRequest/UpdateDishRequest, così il submit non parte con
 * dati che il backend rifiuterebbe.
 */

import { useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { dishFormErrors, dishPayload } from '../../../domain/menu.js';

const FIELD_DEFS = [
  { name: 'name', label: 'nome' },
  { name: 'type', label: 'tipologia' },
  { name: 'price', label: 'prezzo (€)', inputmode: 'decimal' },
  { name: 'photoUrl', label: 'foto (url, opzionale)' }
];

function toForm(dish) {
  return {
    name: dish?.name || '',
    type: dish?.type || '',
    price: dish?.price ?? '',
    photoUrl: dish?.photoUrl || ''
  };
}

export function DishForm({ initial = null, busy = false, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(initial));
  const [errors, setErrors] = useState({});

  const setField = (name, value) => setForm(previous => ({ ...previous, [name]: value }));

  const submit = (event) => {
    event.preventDefault();

    const found = dishFormErrors(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit(dishPayload(form));
  };

  return html`
    <form class="profile-form" onSubmit=${submit} novalidate>
      <div class="profile-grid">
        ${FIELD_DEFS.map(field => html`
          <div class="profile-field" key=${field.name}>
            <label>
              ${field.label}
              <input
                type="text"
                inputmode=${field.inputmode || 'text'}
                value=${form[field.name]}
                onInput=${event => setField(field.name, event.currentTarget.value)}
              />
            </label>
            ${errors[field.name] && html`<span class="profile-field-help error">${errors[field.name]}</span>`}
          </div>
        `)}
      </div>

      <div class="form-actions">
        <${TerminalButton} primary type="submit" disabled=${busy}>
          ${busy ? '[ ... ] salvataggio' : initial ? '[ enter ] salva modifiche' : '[ enter ] aggiungi piatto'}
        <//>
        ${onCancel && html`<${TerminalButton} type="button" onClick=${onCancel}>[ esc ] annulla<//>`}
      </div>
    </form>
  `;
}

export default DishForm;
