/**
 * BufferList - Order items list in the buffer sidebar
 * Shows each item with quantity, code, and price
 */

import { html } from '../../utils/htm.js';

export function BufferList({
  items = [],
  formatEuro = (amount) => `€ ${amount.toFixed(2)}`
}) {
  if (!items.length) {
    return html`
      <div class="buffer-list" id="buffer-list">
        <p class="buffer-empty"><b>_</b> buffer empty<br><span>aggiungi una ricetta per iniziare.</span></p>
      </div>
    `;
  }

  return html`
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
  `;
}

export default BufferList;