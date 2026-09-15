/**
 * OrderHistoryPage - storico degli ordini del cliente. Il filtro (tutti / in
 * corso / consegnati) è quello che il backend accetta davvero su GET /orders/user,
 * quindi resta lato server: la pagina mostra esattamente la pagina di risultati
 * che riceve.
 */

import { useCallback, useState } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { CustomerShell } from '../../components/Layout/CustomerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { AsyncBoundary } from '../../components/Console/AsyncBoundary.jsx';
import { orderService } from '../../services/orderService.js';
import { navigate } from '../../router/navigate.js';
import { ORDER_FILTER_TABS } from '../../domain/orders.js';
import { useResource } from '../../hooks/useResource.js';
import { OrderListItem } from './components/OrderListItem.jsx';

export function OrderHistoryPage() {
  const [tab, setTab] = useState('');

  const load = useCallback(() => orderService.getUserOrders(tab || undefined), [tab]);
  const orders = useResource(load);

  const list = orders.response?.data || [];

  return html`
    <${CustomerShell} title="ordini" subtitle="storico acquisti">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="storico"
          title="I TUOI_"
          titleSpan="ORDINI"
          subtitle="in corso e passati, con il codice da mostrare al ritiro"
        />

        <div class="filter-row">
          ${ORDER_FILTER_TABS.map(option => html`
            <${FilterTab} key=${option.id || 'all'} active=${tab === option.id} onClick=${() => setTab(option.id)}>
              ${option.label}
            <//>
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
      </section>
    <//>
  `;
}

/* il tab riprende il bottone della console, ma resta selezionato quello attivo */
function FilterTab({ active, onClick, children }) {
  return html`
    <button
      class=${`terminal-button compact ${active ? 'primary' : ''}`}
      type="button"
      aria-pressed=${active}
      onClick=${onClick}
    >
      ${children}
    </button>
  `;
}

export default OrderHistoryPage;
