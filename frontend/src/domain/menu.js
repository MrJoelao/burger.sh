/**
 * logica pura del menu di filiale: chi può gestire un piatto, come si separa il
 * menu comune dai piatti custom e la validazione del form. i vincoli replicano
 * CreateDishRequest (openapi.yaml): nome e tipologia di almeno 2 caratteri,
 * prezzo maggiore di zero.
 */

import { entityId } from './entity.js';

export const MIN_NAME_LENGTH = 2;

export function isCustomDish(dish) {
  return dish?.isCustom === true;
}

/* restaurantId arriva come id grezzo (lista filiale) o come oggetto popolato
   (dettaglio piatto): normalizzo entrambi in un solo punto */
export function dishBranchId(dish) {
  const ref = dish?.restaurantId;
  if (!ref) return '';
  return typeof ref === 'object' ? entityId(ref) : String(ref);
}

/* un manager gestisce solo i piatti custom della propria filiale: quelli del
   menu comune restano di sola lettura (backend: dishService.canManageDish) */
export function canManageDish(dish, user) {
  if (user?.role !== 'manager' || !isCustomDish(dish)) return false;
  return dishBranchId(dish) === String(user?.restaurantId || '');
}

export function menuGroups(dishes = []) {
  return {
    custom: dishes.filter(isCustomDish),
    common: dishes.filter(dish => !isCustomDish(dish))
  };
}

export function dishFormErrors({ name = '', type = '', price = '' } = {}) {
  const errors = {};

  if (name.trim().length < MIN_NAME_LENGTH) errors.name = `almeno ${MIN_NAME_LENGTH} caratteri`;
  if (type.trim().length < MIN_NAME_LENGTH) errors.type = `almeno ${MIN_NAME_LENGTH} caratteri`;

  const value = Number(price);
  if (String(price).trim() === '' || !Number.isFinite(value) || value <= 0) {
    errors.price = 'prezzo maggiore di zero';
  }

  return errors;
}

export function dishPayload({ name = '', type = '', price = '', photoUrl = '' } = {}) {
  const payload = {
    name: name.trim(),
    type: type.trim(),
    price: Number(price)
  };

  if (photoUrl.trim()) payload.photoUrl = photoUrl.trim();

  return payload;
}

/* composizione del menu per tipologia, usata dalla testata della pagina menu */
export function typeComposition(dishes = []) {
  const counts = new Map();

  dishes.forEach(dish => {
    const key = String(dish.type || 'altro').toLowerCase();
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ key, label: key, value }));
}
