/**
 * OrdersPanel - lo storico degli ordini dentro il profilo. Il filtro (tutti /
 * in corso / consegnati) è quello che il backend accetta davvero su
 * GET /orders/user, quindi resta lato server: il pannello mostra la pagina di
 * risultati che riceve.
 */

import { useCallback, useState } from 'preact/hooks';
import { html } from '../../../utils/htm.js';
import { orderService } from '../../../services/orderService.js';
import { navigate } from '../../../router/navigate.js';
import { Panel } from './Panel.jsx';
import { AsyncBoundary } from '../../../components/Console/AsyncBoundary.jsx';
import { OrderListItem } from '../../Order/components/OrderListItem.jsx';
import { ORDER_FILTER_TABS } from '../../../domain/orders.js';
import { useResource } from '../../../hooks/useResource.js';

export function OrdersPanel({ active = true }) {
  const [tab, setTab] = useState('');

  const load = useCallback(() => orderService.getUserOrders(tab || undefined), [tab]);
  const orders = useResource(load);

  const list = orders.response?.data || [];

  return html`
    <${Panel} id="ordini" eyebrow="storico" title="I TUOI_" titleSpan="ORDINI" active=${active}>
      <div class="filter-row">
        ${ORDER_FILTER_TABS.map(option => html`
          <button
            key=${option.id || 'all'}
            class=${`terminal-button compact ${tab === option.id ? 'primary' : ''}`}
            type="button"
            aria-pressed=${tab === option.id}
            onClick=${() => setTab(option.id)}
          >
            ${option.label}
          </button>
        `)}
      </div>

      <${AsyncBoundary} loading=${orders.loading} error=${orders.error} label="ordini">
        ${list.length === 0
          ? html`
            <div class="queue-empty">
              <p><b>_</b> nessun ordine${tab ? ' per questo filtro' : ''}.</p>
              <p class="muted">${tab ? 'Prova a cambiare filtro.' : 'Effettua il tuo primo ordine dal menu.'}</p>
            </div>
          `
          : html`
            <ul class="order-queue">
              ${list.map(order => html`
                <${OrderListItem}
                  key=${order.orderCode || order._id}
                  order=${order}
                  onOpen=${id => navigate(`/orders/${id}`)}
                />
              `)}
            </ul>
          `}
      <//>
    <//>
  `;
}

export default OrdersPanel;