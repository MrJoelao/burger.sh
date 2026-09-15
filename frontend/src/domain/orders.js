/**
 * proiezioni pure dell'area ordini del cliente: lo storico, il dettaglio e il
 * carrello leggono la stessa entità Order (openapi.yaml), con riferimenti a
 * volte popolati a volte no. tenerle qui evita che ogni pagina ripeta gli
 * stessi optional chaining e decide da sé quali campi leggere.
 */

import { entityId } from './entity.js';
import { statusLabels, statusFlowFor } from './orderStatus.js';

/* filtri dello storico: i soli valori accettati da GET /orders/user sono
   "current" e "past" (openapi.yaml); il tab senza id chiede tutti gli ordini */
export const ORDER_FILTER_TABS = [
  { id: '', label: 'tutti' },
  { id: 'current', label: 'in corso' },
  { id: 'past', label: 'consegnati' }
];

export const modeLabels = { pickup: 'ritiro', delivery: 'domicilio' };

export function modeLabel(mode) {
  return modeLabels[mode] || 'n/d';
}

/* il codice alfanumerico è quello mostrato al ritiro (requirements.md §6):
   resta la referenza da preferire all'id interno */
export function orderReference(order) {
  return order?.orderCode || entityId(order);
}

/* il nome filiale non è un campo dell'ordine: arriva dalla ref restaurantId
   popolata dal backend (name, city) e resta vuoto se non lo è */
export function restaurantOf(order) {
  const reference = order?.restaurantId;
  if (!reference || typeof reference !== 'object') {
    return { name: '', city: '' };
  }

  return { name: reference.name || '', city: reference.city || '' };
}

export function itemUnits(order) {
  return (order?.orderItems || []).reduce((units, item) => units + (item.quantity || 0), 0);
}

export function itemsSummary(order) {
  const items = order?.orderItems || [];
  if (items.length === 0) {
    return 'nessuna riga';
  }

  return items
    .map(item => `${item.quantity || 0}× ${item.dishId?.name || 'piatto'}`)
    .join(', ');
}

/* tappe della preparazione per una modalità: il ritiro non passa da
   on_delivery, il domicilio non passa da ready. ogni tappa sa se è già stata
   superata, se è quella corrente o se deve ancora arrivare */
export function statusTimeline(mode, status) {
  const flow = statusFlowFor(mode);
  const currentIndex = flow.indexOf(status);

  return flow.map((step, index) => ({
    status: step,
    label: statusLabels[step] || step,
    state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'todo'
  }));
}

/* la conferma di ricezione spetta al cliente e vale solo per un ordine a
   domicilio già in consegna (PATCH /orders/{id}/confirm-delivery) */
export function canConfirmDelivery(order) {
  return order?.mode === 'delivery' && order?.status === 'on_delivery';
}

export function deliveryOf(order) {
  return order?.delivery || null;
}

/* il carrello è un Order in stato draft: le sue righe hanno la stessa forma
   delle righe d'ordine, qui normalizzate nella forma che la UI mostra */
export function cartItemsFrom(order) {
  return (order?.orderItems || []).map(item => ({
    dishId: typeof item.dishId === 'object' && item.dishId !== null ? entityId(item.dishId) : item.dishId,
    name: item.dishId?.name || 'piatto',
    price: Number(item.unitPrice) || 0,
    quantity: item.quantity || 1
  }));
}

/* sintesi dello storico per le metriche della dashboard cliente: la spesa
   conta solo gli ordini consegnati, come gli incassi del manager */
export function orderStats(orders = []) {
  return orders.reduce(
    (stats, order) => ({
      total: stats.total + 1,
      current: stats.current + (order.status === 'delivered' ? 0 : 1),
      delivered: stats.delivered + (order.status === 'delivered' ? 1 : 0),
      spent: stats.spent + (order.status === 'delivered' ? Number(order.totalAmount) || 0 : 0)
    }),
    { total: 0, current: 0, delivered: 0, spent: 0 }
  );
}
