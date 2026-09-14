/**
 * SelectionPanel - Active recipe display with quantity control and add-to-buffer
 */

import { html } from '../../utils/htm.js';
import { QuantityControl } from './QuantityControl.jsx';
import { BufferAction } from './BufferAction.jsx';

export function SelectionPanel({
  recipe,
  quantity = 1,
  onQuantityChange = () => {},
  onAddToBuffer = () => {}
}) {
  if (!recipe) return null;

  const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;
  const selectedTotal = recipe.price * quantity;

  return html`
    <div class="selection-panel">
      <div class="selected-meta"><span class="eyebrow">active recipe</span><span id="recipe-code">${recipe.code}</span></div>
      <h3 id="recipe-name">
        ${recipe.name.split(' ').map((word, index) => html`
          ${index > 0 && html`<br />`}${word}
        `)}
      </h3>
      <p id="recipe-description">${recipe.description}</p>
      <p class="price" id="recipe-price">${formatEuro(recipe.price)}</p>

      <${QuantityControl}
        value=${quantity}
        onChange=${onQuantityChange}
      />

      <${BufferAction}
        total=${selectedTotal}
        onClick=${onAddToBuffer}
      />
    </div>
  `;
}

export default SelectionPanel;