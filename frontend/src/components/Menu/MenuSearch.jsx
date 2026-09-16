import { useMemo, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';

const EMPTY_FILTERS = { query: '', type: '', minPrice: '', maxPrice: '', excludedAllergens: [] };

export function MenuSearch({ dishes = [], onChange }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const types = useMemo(() => [...new Set(dishes.map(dish => String(dish.type || '').trim()).filter(Boolean))].sort(), [dishes]);
  const allergens = useMemo(() => [...new Set(dishes.flatMap(dish => (dish.ingredientIds || [])
    .flatMap(ingredient => typeof ingredient === 'object' ? ingredient.allergens || [] : []))
    .filter(Boolean))].sort(), [dishes]);

  const update = (field, value) => {
    const next = { ...filters, [field]: value };
    setFilters(next);
    onChange(next);
  };

  const toggleAllergen = allergen => {
    const excludedAllergens = filters.excludedAllergens.includes(allergen)
      ? filters.excludedAllergens.filter(item => item !== allergen)
      : [...filters.excludedAllergens, allergen];
    update('excludedAllergens', excludedAllergens);
  };

  const reset = () => {
    setFilters(EMPTY_FILTERS);
    onChange(EMPTY_FILTERS);
  };

  return html`
    <section class="menu-search" aria-labelledby="menu-search-title">
      <div class="menu-search-heading">
        <div>
          <p class="eyebrow">ricerca pro</p>
          <h2 id="menu-search-title">TROVA IL TUO PIATTO_</h2>
        </div>
        <button class="terminal-button compact" type="button" onClick=${reset}>[ reset ]</button>
      </div>
      <div class="menu-search-fields">
        <label class="menu-search-query">
          <span>cerca</span>
          <input type="search" value=${filters.query} placeholder="nome o ingrediente" onInput=${event => update('query', event.target.value)} />
        </label>
        <label>
          <span>tipologia</span>
          <select value=${filters.type} onChange=${event => update('type', event.target.value)}>
            <option value="">tutte</option>
            ${types.map(type => html`<option value=${type}>${type}</option>`)}
          </select>
        </label>
        <label>
          <span>prezzo da</span>
          <input type="number" min="0" step="0.01" value=${filters.minPrice} placeholder="0,00" onInput=${event => update('minPrice', event.target.value)} />
        </label>
        <label>
          <span>prezzo a</span>
          <input type="number" min="0" step="0.01" value=${filters.maxPrice} placeholder="∞" onInput=${event => update('maxPrice', event.target.value)} />
        </label>
      </div>
      ${allergens.length > 0 && html`
        <fieldset class="allergen-filter">
          <legend>escludi allergeni</legend>
          <div class="allergen-options">
            ${allergens.map(allergen => html`
              <label>
                <input type="checkbox" checked=${filters.excludedAllergens.includes(allergen)} onChange=${() => toggleAllergen(allergen)} />
                <span>${allergen}</span>
              </label>
            `)}
          </div>
        </fieldset>
      `}
    </section>
  `;
}
