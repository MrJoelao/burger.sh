/**
 * Mappatura stati ordine condivisa da dashboard, storico e dettaglio ordine.
 * Valori di stato come da openapi.yaml: draft, ordered, preparing, ready, on_delivery, delivered, cancelled
 */

export const statusLabels = {
  draft: 'CARRELLO',
  ordered: 'ORDINATO',
  confirmed: 'CONFERMATO',
  preparing: 'IN PREPARAZIONE',
  ready: 'PRONTO',
  on_delivery: 'IN CONSEGNA',
  delivered: 'CONSEGNATO',
  cancelled: 'ANNULLATO'
};

export const statusColors = {
  draft: 'var(--dirty)',
  ordered: 'var(--amber)',
  confirmed: 'var(--amber)',
  preparing: 'var(--amber)',
  ready: 'var(--acid)',
  on_delivery: 'var(--amber)',
  delivered: 'var(--paper)',
  cancelled: 'var(--alert)'
};

export const statusOrder = ['ordered', 'confirmed', 'preparing', 'ready', 'on_delivery', 'delivered'];

/* stati che il backend accetta nel filtro della coda ordini di una filiale
   (validations/orderValidation.js): sono i valori reali della state machine,
   senza quelli di sola UI come "confirmed" e "cancelled", che il backend non
   produce mai e che quindi non selezionerebbero nessun ordine */
export const filterableStatuses = ['ordered', 'preparing', 'ready', 'on_delivery', 'delivered'];

/* sequenza di stati ammessi per ogni modalità di completamento: il ritiro
   salta "on_delivery" (non c'è consegna), la consegna a domicilio salta
   "ready" (il cliente non ritira di persona). è la stessa state machine del
   backend (services/orderService.js), così la UI propone solo la mossa valida
   e la transizione non viene mai rifiutata con 400. */
export const statusFlows = {
  pickup: ['ordered', 'preparing', 'ready', 'delivered'],
  delivery: ['ordered', 'preparing', 'on_delivery', 'delivered']
};

export function statusFlowFor(mode) {
  return statusFlows[mode] || [];
}

/* prossimo stato raggiungibile, oppure null se l'ordine è già concluso o lo
   stato corrente non appartiene al flusso della modalità */
export function nextStatus(mode, currentStatus) {
  const flow = statusFlowFor(mode);
  const index = flow.indexOf(currentStatus);

  if (index === -1) return null;
  return flow[index + 1] || null;
}
