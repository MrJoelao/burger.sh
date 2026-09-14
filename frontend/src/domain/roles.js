/**
 * Ruoli applicativi e destinazione di atterraggio.
 * dashboardPathFor centralizza la scelta della dashboard per ruolo, così setup,
 * login e cambio password non ripetono lo stesso if/else.
 */

export const roleLabels = {
  customer: 'cliente',
  manager: 'manager',
  admin: 'admin'
};

export function dashboardPathFor(role) {
  if (role === 'admin') return '/dashboard/admin';
  if (role === 'manager') return '/dashboard/manager';
  if (role === 'customer') return '/dashboard';
  return '/';
}

export const ADMIN_HOME = '/dashboard/admin';

/* rotte che l'admin puo vedere: la sua area, il profilo, il cambio password
   forzato e il dettaglio di un ordine (l'admin supervisiona anche gli ordini).
   lo storefront, le aree cliente e quelle manager restano fuori. */
const ADMIN_ALLOWED = [
  /^\/dashboard\/admin$/,
  /^\/admin(?:\/|$)/,
  /^\/profile$/,
  /^\/change-password$/,
  /^\/orders\/(?!confirm$)[\w-]+$/
];

export function adminCanVisit(path) {
  return ADMIN_ALLOWED.some(pattern => pattern.test(path));
}

/* destinazione forzata in base a sessione e percorso, oppure null se il
   percorso va bene così. l'admin resta confinato nella sua console. */
export function redirectFor(user, path) {
  if (user?.mustChangePassword) {
    return path === '/change-password' || path === '/setup' ? null : '/change-password';
  }

  if (user?.role === 'admin' && !adminCanVisit(path)) {
    return ADMIN_HOME;
  }

  return null;
}
