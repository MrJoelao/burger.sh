/**
 * OrderQueue - coda degli ordini della filiale. Ogni riga porta il codice, lo
 * stato, il cliente e le righe d'ordine, più l'unica mossa ammessa dalla state
 * machine di quella modalità (ritiro o domicilio).
 */

import { html } from '../../../utils/htm.js';
import { TerminalButton } from '../../../components/Auth/TerminalButton.jsx';
import { statusLabels, nextStatus } from '../../../domain/orderStatus.js';
import { statusTones } from '../../../domain/tones.js';
import { euro, dateTime } from '../../../domain/format.js';
import { entityId } from '../../../domain/entity.js';

const MODE_LABELS = { pickup: 'ritiro', delivery: 'domicilio' };

export function OrderQueue({ orders = [], busyId = null, onAdvance }) {
  if (orders.length === 0) {
    return html`<p class="queue-empty"><b>_</b> nessun ordine per questo filtro.</p>`;
  }

  return html`
    <ul class="order-queue">
      ${orders.map(order => renderOrder(order, busyId, onAdvance))}
    </ul>
  `;
}

function renderOrder(order, busyId, onAdvance) {
  const id = entityId(order);
  const next = nextStatus(order.mode, order.status);

  return html`
    <li class="order-item" key=${id}>
      <header class="order-head">
        <b class="order-code">${order.orderCode || id}</b>
        <span class=${`tag tone-${statusTones[order.status] || 'dirty'}`}>
          ${statusLabels[order.status] || order.status}
        </span>
      </header>

      <p class="order-meta">
        <span>${MODE_LABELS[order.mode] || order.mode || 'n/d'}</span>
        <span>${customerName(order.customerId)}</span>
        <span>${dateTime(order.createdAt)}</span>
      </p>

      <p class="order-items">${itemsSummary(order.orderItems)}</p>

      <footer class="order-foot">
        <b>${euro(order.totalAmount)}</b>
        ${next
          ? html`
            <${TerminalButton}
              className="compact"
              primary
              disabled=${busyId === id}
              onClick=${() => onAdvance(id, next)}
            >
              [ → ] ${statusLabels[next]}
            <//>
          `
          : html`<span class="muted">concluso</span>`}
      </footer>
    </li>
  `;
}

function customerName(customer) {
  if (!customer || typeof customer !== 'object') return 'cliente n/d';
  return `${customer.name || ''} ${customer.surname || ''}`.trim() || customer.email || 'cliente n/d';
}

function itemsSummary(items = []) {
  if (items.length === 0) return 'nessuna riga';

  return items
    .map(item => `${item.quantity || 0}× ${item.dishId?.name || 'piatto'}`)
    .join(', ');
}

export default OrderQueue;
