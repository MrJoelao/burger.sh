/**
 * RecipeButton - Individual recipe button in the matrix
 */

import { html } from '../../utils/htm.js';

export function RecipeButton({
  code = 'B-01 / CORE',
  name = 'SMASH CLASSIC',
  description = 'Doppio smash di manzo, cheddar fuso, cipolla, cetriolini e salsa della casa.',
  price = 10.50,
  active = false,
  onClick = () => {}
}) {
  const formatPrice = (amount) => `€ ${amount.toFixed(2)}`;

  return html`
    <button
      class="recipe ${active ? 'active' : ''}"
      type="button"
      data-code=${code}
      data-name=${name}
      data-description=${description}
      data-price=${price}
      onClick=${onClick}
    >
      <span><b>${code.split(' / ')[0].replace('B-', '')}</b> ${code.split(' / ')[1].toLowerCase()} unit</span>
      <strong>${name.toLowerCase()}</strong>
      <em>${formatPrice(price)}</em>
    </button>
  `;
}

export default RecipeButton;