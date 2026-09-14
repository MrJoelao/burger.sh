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
