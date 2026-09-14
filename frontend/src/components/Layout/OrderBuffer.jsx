/**
 * OrderBuffer - Right sidebar showing order buffer/cart
 */

import { html } from '../../utils/htm.js';

export function OrderBuffer({
  items = [],
  onClear = () => {},
  emptyMessage = 'aggiungi una ricetta per iniziare.',
  showItemCount = true,
  showSubtotal = true
}) {
  const unitCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);

  const formatEuro = (amount) => `€ ${amount.toFixed(2)}`;

  if (!items.length) {
    return html`
      <aside class="order-buffer" aria-label="Buffer ordine">
        <header>
          <p class="eyebrow">order buffer / ram</p>
          <h2>CURRENT<br>BATCH</h2>
          <span class="buffer-mark">rw</span>
        </header>
        <div class="buffer-list" id="buffer-list">
          <p class="buffer-empty"><b>_</b> buffer empty<br><span>${emptyMessage}</span></p>
        </div>
        <footer class="buffer-total">
          ${showItemCount && html`<p><span>units</span><b id="item-count">00</b></p>`}
          ${showSubtotal && html`<p><span>subtotal</span><strong id="cart-total">€ 0.00</strong></p>`}
          <button type="button" id="clear-buffer" class="terminal-button" onClick=${onClear}>[ esc ] clear buffer</button>
        </footer>
      </aside>
    `;
  }

  return html`
    <aside class="order-buffer" aria-label="Buffer ordine">
      <header>
        <p class="eyebrow">order buffer / ram</p>
        <h2>CURRENT<br>BATCH</h2>
        <span class="buffer-mark">rw</span>
      </header>
      <div class="buffer-list" id="buffer-list">
        ${items.map((item, index) => html`
          <article class="buffer-item">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <div>
              <b>${item.name}</b>
              <small>${item.code || ''} · qty ${item.quantity || 1}</small>
            </div>
            <strong>${formatEuro((item.price || 0) * (item.quantity || 1))}</strong>
          </article>
        `)}
      </div>
      <footer class="buffer-total">
        ${showItemCount && html`<p><span>units</span><b id="item-count">${String(unitCount).padStart(2, '0')}</b></p>`}
        ${showSubtotal && html`<p><span>subtotal</span><strong id="cart-total">${formatEuro(subtotal)}</strong></p>`}
        <button type="button" id="clear-buffer" class="terminal-button" onClick=${onClear}>[ esc ] clear buffer</button>
      </footer>
    </aside>
  `;
}

export default OrderBuffer;