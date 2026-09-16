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
    photoUrl: dish?.photoUrl || '',
    ingredientIds: (dish?.ingredientIds || []).map(item => typeof item === 'object' ? item._id : item)
  };
}

export function DishForm({
  initial = null,
  busy = false,
  onSubmit,
  onCancel,
  ingredients = [],
  ingredientsLoading = false,
  ingredientsError = null,
  onCreateIngredient
}) {
  const [form, setForm] = useState(() => toForm(initial));
  const [errors, setErrors] = useState({});
  const [newIngredient, setNewIngredient] = useState({ name: '', allergens: '' });
  const [creatingIngredient, setCreatingIngredient] = useState(false);

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

  const toggleIngredient = id => setForm(previous => ({
    ...previous,
    ingredientIds: previous.ingredientIds.includes(id)
      ? previous.ingredientIds.filter(item => item !== id)
      : [...previous.ingredientIds, id]
  }));

  const addIngredient = async () => {
    if (!newIngredient.name.trim() || !onCreateIngredient) return;
    setCreatingIngredient(true);
    try {
      const result = await onCreateIngredient(
        newIngredient.name.trim(),
        newIngredient.allergens.split(',').map(item => item.trim()).filter(Boolean)
      );
      const id = result?.data?._id;
      if (id) {
        setForm(previous => ({ ...previous, ingredientIds: [...new Set([...previous.ingredientIds, id])] }));
        setNewIngredient({ name: '', allergens: '' });
      }
    } finally {
      setCreatingIngredient(false);
    }
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

      <fieldset class="ingredient-manager-field">
        <legend>ingredienti</legend>
        <div class="ingredient-create">
          <input
            type="text"
            placeholder="nuovo ingrediente"
            value=${newIngredient.name}
            onInput=${event => setNewIngredient(previous => ({ ...previous, name: event.currentTarget.value }))}
            aria-label="nome nuovo ingrediente"
          />
          <input
            type="text"
            placeholder="allergeni, separati da virgola"
            value=${newIngredient.allergens}
            onInput=${event => setNewIngredient(previous => ({ ...previous, allergens: event.currentTarget.value }))}
            aria-label="allergeni nuovo ingrediente"
          />
          <button type="button" class="ingredient-create-button" onClick=${addIngredient} disabled=${creatingIngredient}>
            ${creatingIngredient ? '[ ... ]' : '[ + ]'} crea ingrediente
          </button>
        </div>
        ${ingredientsLoading && html`<p class="wizard-hint">caricamento ingredienti...</p>`}
        ${ingredientsError && html`<p class="form-message">impossibile caricare gli ingredienti.</p>`}
        ${!ingredientsLoading && !ingredientsError && ingredients.length > 0 && html`
          <div class="ingredient-picker" aria-label="Ingredienti disponibili">
            ${ingredients.map(ingredient => {
              const selected = form.ingredientIds.includes(ingredient._id);
              return html`
                <button
                  type="button"
                  class=${`ingredient-card ${selected ? 'selected' : ''}`}
                  aria-pressed=${selected}
                  onClick=${() => toggleIngredient(ingredient._id)}
                >
                  <span>${ingredient.name}</span><b>${selected ? '✓' : '+'}</b>
                </button>
              `;
            })}
          </div>
        `}
      </fieldset>

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
