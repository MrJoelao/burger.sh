/**
 * OrderListItem - riga di un ordine nello storico e nei recenti della
 * dashboard. Mostra il codice alfanumerico (quello da esibire al ritiro), lo
 * stato, la filiale popolata, modalità e data, più la riga d'apertura.
 */

import { html } from '../../../utils/htm.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { statusLabels } from '../../../domain/orderStatus.js';
import { statusTones } from '../../../domain/tones.js';
import { euro, dateTime } from '../../../domain/format.js';
import { entityId } from '../../../domain/entity.js';
import { orderReference, restaurantOf, modeLabel, itemsSummary, itemUnits } from '../../../domain/orders.js';

export function OrderListItem({ order, showAmount = true, onOpen = () => {} }) {
  const id = entityId(order);
  const restaurant = restaurantOf(order);

  return html`
    <li class="order-item" key=${id}>
      <header class="order-head">
        <b class="order-code">${orderReference(order)}</b>
        <span class=${`tag tone-${statusTones[order.status] || 'dirty'}`}>
          ${statusLabels[order.status] || order.status || 'stato n/d'}
        </span>
      </header>

      <p class="order-meta">
        <span>${restaurant.name || 'filiale n/d'}${restaurant.city ? ` · ${restaurant.city}` : ''}</span>
        <span>${modeLabel(order.mode)}</span>
        <span>${dateTime(order.createdAt)}</span>
      </p>

      <p class="order-items">${itemsSummary(order)}</p>

      <footer class="order-foot">
        ${showAmount
          ? html`<b>${euro(order.totalAmount)}</b>`
          : html`<span class="muted">${itemUnits(order)} unità</span>`}
        <${TerminalButton} className="compact" onClick=${() => onOpen(id)}>[ enter ] dettagli<//>
      </footer>
    </li>
  `;
}

export default OrderListItem;
