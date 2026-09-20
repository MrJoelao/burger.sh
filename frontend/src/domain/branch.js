/**
 * logica pura della filiale del manager: come risolvere l'id della propria
 * sede, quali campi sono modificabili e la validazione del form. i vincoli
 * replicano UpdateRestaurantRequest (openapi.yaml): nome >= 2, indirizzo >= 5,
 * città >= 2, telefono nel formato ammesso, partita IVA richiesta.
 */

import { entityId } from './entity.js';

export const BRANCH_FIELDS = [
  { name: 'name', label: 'nome' },
  { name: 'address', label: 'indirizzo' },
  { name: 'city', label: 'città' },
  { name: 'phone', label: 'telefono' },
  { name: 'vatNumber', label: 'partita iva' }
];

const PHONE_PATTERN = /^\+?[0-9\s\-()]+$/;

/* la sede del manager arriva da /users/me come restaurantId (forma ridotta)
   oppure come restaurant._id quando il backend popola il documento completo */
export function branchIdOf(user) {
  return user?.restaurantId || entityId(user?.restaurant) || '';
}

export function branchForm(branch = {}) {
  return BRANCH_FIELDS.reduce((form, field) => {
    form[field.name] = branch[field.name] || '';
    return form;
  }, {});
}

export function branchErrors(form = {}) {
  const errors = {};

  if ((form.name || '').trim().length < 2) errors.name = 'almeno 2 caratteri';
  if ((form.address || '').trim().length < 5) errors.address = 'almeno 5 caratteri';
  if ((form.city || '').trim().length < 2) errors.city = 'almeno 2 caratteri';
  if (!PHONE_PATTERN.test((form.phone || '').trim())) errors.phone = 'telefono non valido';
  if (!(form.vatNumber || '').trim()) errors.vatNumber = 'partita iva richiesta';

  return errors;
}

export function branchPayload(form = {}) {
  return BRANCH_FIELDS.reduce((payload, field) => {
    payload[field.name] = (form[field.name] || '').trim();
    return payload;
  }, {});
}
