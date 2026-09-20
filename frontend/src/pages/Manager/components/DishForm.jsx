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
  { name: 'name', label: 'nome', placeholder: 'es. Burger Classico' },
  { name: 'type', label: 'tipologia', placeholder: 'es. burger, pizza, bevanda' },
  { name: 'price', label: 'prezzo (€)', type: 'number', inputmode: 'decimal', placeholder: '8.50' },
  { name: 'photoUrl', label: 'foto (URL, opzionale)', type: 'url', placeholder: 'https://...' }
];

function toForm(dish) {
  return {
    name: dish?.name || '',
    type: dish?.type || '',
    price: dish?.price ?? '',
    photoUrl: dish?.photoUrl || '',
    ingredientIds: (dish?.ingredientIds || []).map(item => typeof item === 'object' ? item._id : item)
  };
}

export function DishForm({
  initial = null,
  busy = false,
  onSubmit,
  onCancel
}) {
  const [form, setForm] = useState(() => toForm(initial));
  const [errors, setErrors] = useState({});

  const setField = (name, value) => setForm(previous => ({ ...previous, [name]: value }));

  const submit = (event) => {
    event.preventDefault();

    const found = dishFormErrors(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = dishPayload(form);
    if (form.ingredientIds.length > 0) payload.ingredientIds = form.ingredientIds;
    onSubmit(payload);
  };

  return html`
    <form class="profile-form dish-manager-form" onSubmit=${submit} novalidate>
      <p class="wizard-hint dish-schema-hint">Il piatto sarà salvato come custom della filiale. Foto e ingredienti sono opzionali.</p>
      <div class="wizard-fields">
        ${FIELD_DEFS.map(field => html`
          <div class=${`wizard-field ${field.name === 'name' || field.name === 'photoUrl' ? 'wide' : ''}`} key=${field.name}>
            <label>
              ${field.label}
              <input
              type=${field.type || 'text'}
                inputmode=${field.inputmode || 'text'}
              placeholder=${field.placeholder || ''}
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
