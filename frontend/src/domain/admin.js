/**
 * logica pura dell'area admin: filtri di ricerca utenti e riconoscimento della
 * coda di approvazione. gli identificatori e la composizione dei totali sono
 * condivisi con le altre console e vivono nei moduli dedicati: qui vengono
 * riesportati per tenere stabile l'API usata dalle pagine admin.
 */

export { entityId as userId } from './entity.js';
export { roleComposition, orderComposition, totalOf } from './analytics.js';
export { managerStatusLabels } from './roles.js';

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
