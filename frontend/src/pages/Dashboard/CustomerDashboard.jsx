/**
 * CustomerDashboard - plancia del cliente. In alto mostra gli ordini ancora da
 * consegnare, perché devono essere subito visibili; sotto le metriche complessive
 * e la scorciatoia per ordinare. Lo storico completo vive nel profilo.
 */

import { useCallback } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { CustomerShell } from '../../components/Layout/CustomerShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { StatTile } from '../../components/Console/StatTile.jsx';
import { AsyncBoundary } from '../../components/Console/AsyncBoundary.jsx';
import { orderService } from '../../services/orderService.js';
import { useAuthStore } from '../../state/authStore.js';
import { navigate } from '../../router/navigate.js';
import { euro } from '../../domain/format.js';
import { orderStats, activeOrders } from '../../domain/orders.js';
import { useResource } from '../../hooks/useResource.js';
import { OrderListItem } from '../Order/components/OrderListItem.jsx';

const RECENT_ORDERS_LIMIT = 5;

export function CustomerDashboard() {
  const { user } = useAuthStore();

  const load = useCallback(() => orderService.getUserOrders(), []);
  const orders = useResource(load);

  const list = orders.response?.data || [];
  const stats = orderStats(list);
  const active = activeOrders(list);
  const recent = list.slice(0, RECENT_ORDERS_LIMIT);

  return html`
    <${CustomerShell} title="dashboard" subtitle="account personale">
      <section class="terminal-screen">
        <${SectionHeading}
          eyebrow="profilo"
          title="BENVENUTO_"
          titleSpan=${user?.name || 'cliente'}
          subtitle="i tuoi ordini, in corso e passati"
        />

        <${AsyncBoundary} loading=${orders.loading} error=${orders.error} label="ordini">
          <div class="panel-block">
            <${SectionHeading} eyebrow="in corso" title="I TUOI_" titleSpan="ORDINI" subtitle="ancora da ricevere, facilmente visibili" />
            ${active.length === 0
              ? html`
                <div class="queue-empty">
                  <p><b>_</b> nessun ordine in corso.</p>
                  <p class="muted">Quando effettui un ordine appare qui.</p>
                </div>
              `
              : html`
                <ul class="order-queue">
                  ${active.map(order => html`
                    <${OrderListItem}
                      key=${order.orderCode || order._id}
                      order=${order}
                      showAmount=${false}
                      onOpen=${id => navigate(`/orders/${id}`)}
                    />
                  `)}
                </ul>
              `}
          </div>

          <div class="panel-block">
            <div class="telemetry-rail">
              <${StatTile} eyebrow="ordini totali" value=${stats.total} />
              <${StatTile} eyebrow="in corso" value=${stats.current} caption="ancora da ricevere" />
              <${StatTile} eyebrow="consegnati" value=${stats.delivered} />
              <${StatTile} eyebrow="spesa" value=${stats.spent} display=${euro(stats.spent)} caption="sui soli ordini consegnati" />
            </div>
          </div>

          <div class="panel-block">
            <${SectionHeading} eyebrow="strumenti" title="SCORCIATOIE" />
            <div class="shortcut-row">
              <${TerminalButton} primary onClick=${() => navigate('/orders')}>[ 1 ] ordina<//>
              <${TerminalButton} onClick=${() => navigate('/profile')}>[ 2 ] profilo<//>
            </div>
          </div>
        <//>
      </section>
    <//>
  `;
}

export default CustomerDashboard;