/**
 * QuantityControl - +/- buttons with output display
 */

import { html } from '../../utils/htm.js';

export function QuantityControl({
  value = 1,
  min = 1,
  max = 9,
  onChange = () => {},
  label = 'quantity',
  ariaLabelDecrease = 'Riduci quantità',
  ariaLabelIncrease = 'Aumenta quantità'
}) {
  return html`
    <div class="quantity-control" aria-label=${label}>
      <span class="eyebrow">${label}</span>
      <button
        type="button"
        id="decrease"
        aria-label=${ariaLabelDecrease}
        onClick=${() => onChange(Math.max(min, value - 1))}
        disabled=${value <= min}
      >−</button>
      <output id="quantity">${String(value).padStart(2, '0')}</output>
      <button
        type="button"
        id="increase"
        aria-label=${ariaLabelIncrease}
        onClick=${() => onChange(Math.min(max, value + 1))}
        disabled=${value >= max}
      >+</button>
    </div>
  `;
}

export default QuantityControl;