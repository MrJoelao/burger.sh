/**
 * OrderDetailPage - dettaglio e tracciamento di un ordine. Il percorso di stato
 * è quello della modalità (ritiro o domicilio), gli importi sono quelli
 * calcolati dal server e, quando l'ordine è a domicilio e in consegna, il
 * cliente chiude il ciclo confermando la ricezione. La cornice segue il ruolo:
 * il cliente resta nella sua area, manager e admin nelle rispettive console.
 */

import { useCallback } from 'preact/hooks';
import { html } from '../../utils/htm.js';
import { CustomerShell } from '../../components/Layout/CustomerShell.jsx';
import { ManagerShell } from '../../components/Layout/ManagerShell.jsx';
import { AdminShell } from '../../components/Layout/AdminShell.jsx';
import { SectionHeading } from '../../components/UI/SectionHeading.jsx';
import { TerminalButton } from '../../components/Auth/TerminalButton.jsx';
import { AsyncBoundary } from '../../components/Console/AsyncBoundary.jsx';
import { orderService } from '../../services/orderService.js';
import { useAuthStore } from '../../state/authStore.js';
import { navigate } from '../../router/navigate.js';
import { euro, dateTime } from '../../domain/format.js';
import { canConfirmDelivery, deliveryOf, itemUnits, modeLabel, orderReference, restaurantOf } from '../../domain/orders.js';
import { useResource, useAction } from '../../hooks/useResource.js';
import { OrderStatusTimeline } from './components/OrderStatusTimeline.jsx';

/* una cornice per ruolo: aggiungerne uno non tocca il rendering del dettaglio */
const SHELLS = {
  customer: CustomerShell,
  manager: ManagerShell,
  admin: AdminShell
};

export function OrderDetailPage({ orderId }) {
  const { user } = useAuthStore();
  const Shell = SHELLS[user?.role] || CustomerShell;

  const load = useCallback(() => orderService.getOrder(orderId), [orderId]);
  const order = useResource(load);
  const action = useAction({ onSuccess: order.reload });

  const data = order.response?.data;

  return html`
    <${Shell} title="order-detail" subtitle="tracking">
      <section class="terminal-screen">
        <${AsyncBoundary} loading=${order.loading} error=${order.error} label="ordine">
          ${data
            ? renderOrder({ order: data, action, orderId, reload: order.reload })
            : html`<p class="queue-empty"><b>_</b> ordine non trovato.</p>`}
        <//>
      </section>
    <//>
  `;
}

function renderOrder({ order, action, orderId, reload }) {
  const restaurant = restaurantOf(order);
  const delivery = deliveryOf(order);
  const confirmable = canConfirmDelivery(order);

  return html`
    <${SectionHeading}
      eyebrow="ordine"
      title="ORDINE_"
      titleSpan=${orderReference(order)}
      subtitle=${`${restaurant.name || 'filiale n/d'} · ${dateTime(order.createdAt)}`}
    />

    ${action.actionError && html`<div class="alert alert-danger" role="alert"><strong>errore:</strong> ${action.actionError}</div>`}

    <div class="panel-block">
      <${SectionHeading} eyebrow="avanzamento" title="STATO_" titleSpan=${modeLabel(order.mode).toUpperCase()} />
      <${OrderStatusTimeline} mode=${order.mode} status=${order.status} />
    </div>

    <div class="panel-block">
      <${SectionHeading} eyebrow="riepilogo" title="ARTICOLI" subtitle=${`${itemUnits(order)} unità`} />
      ${renderItems(order)}
    </div>

    <div class="telemetry-rail">
      <article class="telemetry-card">
        <p class="eyebrow">modalità</p>
        <p class="telemetry-value">${modeLabel(order.mode)}</p>
        ${delivery && html`
          <p class="telemetry-caption">${delivery.address}</p>
          <p class="telemetry-caption">
            ${delivery.distanceKm != null ? `${delivery.distanceKm} km` : 'distanza n/d'}
            · consegna ${euro(delivery.deliveryFee)}
          </p>
        `}
      </article>
      <article class="telemetry-card">
        <p class="eyebrow">filiale</p>
        <p class="telemetry-value">${restaurant.name || 'n/d'}</p>
        <p class="telemetry-caption">${restaurant.city || 'città n/d'}</p>
      </article>
      <article class="telemetry-card">
        <p class="eyebrow">totale</p>
        <p class="telemetry-value">${euro(order.totalAmount)}</p>
        <p class="telemetry-caption">calcolato dal server</p>
      </article>
    </div>

    <div class="shortcut-row panel-block">
      <${TerminalButton} onClick=${() => navigate('/orders')}>[ esc ] storico ordini<//>
      <${TerminalButton} onClick=${reload}>[ F5 ] aggiorna<//>
      ${confirmable && html`
        <${TerminalButton} primary disabled=${action.busyId === orderId} onClick=${() => action.run(orderId, () => orderService.confirmDelivery(orderId))}>
          [ enter ] conferma ricezione
        <//>
      `}
    </div>
  `;
}

function renderItems(order) {
  const items = order.orderItems || [];
  if (items.length === 0) {
    return html`<p class="queue-empty"><b>_</b> nessuna riga in questo ordine.</p>`;
  }

  return html`
    <ul class="order-queue">
      ${items.map((item, index) => html`
        <li class="order-item" key=${item.dishId?._id || item.dishId || index}>
          <header class="order-head">
            <b class="order-code">${item.dishId?.name || 'piatto'}</b>
            <span class="tag tone-amber">${item.quantity}×</span>
          </header>
          <p class="order-meta"><span>${euro(item.unitPrice)} cad.</span></p>
          <footer class="order-foot"><b>${euro((item.unitPrice || 0) * (item.quantity || 1))}</b></footer>
        </li>
      `)}
    </ul>
  `;
}

export default OrderDetailPage;
