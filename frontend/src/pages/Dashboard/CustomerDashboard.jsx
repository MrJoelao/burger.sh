/**
 * CustomerDashboard - plancia del cliente. Riassume i propri ordini (totali, in
 * corso, consegnati, spesa), mostra i più recenti con il codice da esibire al
 * ritiro e apre le scorciatoie verso menu, storico e metodi di pagamento.
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
import { orderStats } from '../../domain/orders.js';
import { useResource } from '../../hooks/useResource.js';
import { OrderListItem } from '../Order/components/OrderListItem.jsx';

const RECENT_ORDERS_LIMIT = 5;

export function CustomerDashboard() {
  const { user } = useAuthStore();

  const load = useCallback(() => orderService.getUserOrders(), []);
  const orders = useResource(load);

  const list = orders.response?.data || [];
  const stats = orderStats(list);
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
          <div class="telemetry-rail">
            <${StatTile} eyebrow="ordini totali" value=${stats.total} />
            <${StatTile} eyebrow="in corso" value=${stats.current} caption="ancora da ricevere" />
            <${StatTile} eyebrow="consegnati" value=${stats.delivered} />
            <${StatTile} eyebrow="spesa" value=${stats.spent} display=${euro(stats.spent)} caption="sui soli ordini consegnati" />
          </div>

          <div class="panel-block">
            <${SectionHeading} eyebrow="attività" title="ORDINI_" titleSpan="RECENTI" />
            ${recent.length === 0
              ? html`
                <div class="queue-empty">
                  <p><b>_</b> nessun ordine ancora.</p>
                  <p class="muted">Componi il primo ordine dal menu della filiale che preferisci.</p>
                </div>
              `
              : html`
                <ul class="order-queue">
                  ${recent.map(order => html`
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
            <${SectionHeading} eyebrow="strumenti" title="SCORCIATOIE" />
            <div class="shortcut-row">
              <${TerminalButton} primary onClick=${() => navigate('/menu')}>[ 1 ] ordina<//>
              <${TerminalButton} onClick=${() => navigate('/orders')}>[ 2 ] storico ordini<//>
              <${TerminalButton} onClick=${() => navigate('/payment-methods')}>[ 3 ] pagamenti<//>
            </div>
          </div>
        <//>
      </section>
    <//>
  `;
}

export default CustomerDashboard;
