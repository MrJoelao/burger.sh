/**
 * Logica pura dell'area admin: filtri di ricerca utenti e scomposizione delle
 * aggregazioni in segmenti per le barre di composizione. Nessuna chiamata di
 * rete qui, così le pagine restano presentazione e questa parte si verifica da
 * sola.
 */

import { roleLabels } from './roles.js';
import { statusLabels, statusOrder } from './orderStatus.js';

export const managerStatusLabels = {
  pending: 'in attesa',
  approved: 'approvato',
  rejected: 'rifiutato'
};

/* managerStatus è un filtro valido solo insieme a role=manager
   (vedi openapi.yaml, GET /admin/users) */
export function userQuery({ role = '', managerStatus = '' } = {}) {
  const query = {};

  if (role) query.role = role;
  if (role === 'manager' && managerStatus) query.managerStatus = managerStatus;

  return query;
}

export function isPendingManager(user) {
  return user?.role === 'manager' && user?.managerStatus === 'pending';
}

/* l'id arriva come `id` dalla risposta di login e come `_id` dalle liste admin,
   dove mongoose serializza il documento grezzo: un solo posto lo normalizza */
export function userId(entity) {
  return entity?.id || entity?._id || '';
}

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
