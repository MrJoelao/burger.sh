/**
 * composizione di un totale in segmenti proporzionali, per le barre di
 * riepilogo condivise da dashboard manager e statistiche admin. nessuna
 * chiamata di rete qui, così questa parte si verifica da sola.
 */

import { roleLabels } from './roles.js';
import { statusLabels, statusOrder } from './orderStatus.js';

/* composizione utenti per ruolo, in ordine di lettura: clienti, manager, admin */
export function roleComposition(byRole = {}) {
  return ['customer', 'manager', 'admin']
    .map(role => ({ key: role, label: roleLabels[role] || role, value: byRole[role] || 0 }))
    .filter(segment => segment.value > 0);
}

/* composizione ordini per stato, nell'ordine in cui il flusso li attraversa */
export function orderComposition(byStatus = {}) {
  return statusOrder
    .filter(status => (byStatus[status] || 0) > 0)
    .map(status => ({ key: status, label: statusLabels[status] || status, value: byStatus[status] }));
}

export function totalOf(segments = []) {
  return segments.reduce((sum, segment) => sum + segment.value, 0);
}
