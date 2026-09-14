/**
 * BufferTotal - Footer of order buffer showing subtotal, item count, clear action
 */

import { html } from '../../utils/htm.js';

export function BufferTotal({
  items = [],
  onClear = () => {},
  formatEuro = (amount) => `€ ${amount.toFixed(2)}`
}) {
  const unitCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  return html`
    <footer class="buffer-total">
      <p><span>units</span><b id="item-count">${String(unitCount).padStart(2, '0')}</b></p>
      <p><span>subtotal</span><strong id="cart-total">${formatEuro(subtotal)}</strong></p>
      <button
        type="button"
        id="clear-buffer"
        class="terminal-button"
        onClick=${onClear}
      >
        [ esc ] clear buffer
      </button>
    </footer>
  `;
}

export default BufferTotal;