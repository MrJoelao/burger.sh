/**
 * logica pura della pagina profilo: quali sezioni mostrare per ruolo, i campi
 * anagrafici e di indirizzo, la validazione della nuova password e il
 * riconoscimento delle filiali di un manager. Nessuna chiamata di rete qui,
 * così la pagina resta presentazione e queste regole si verificano da sole.
 */

import { userId } from './admin.js';

export const MIN_PASSWORD_LENGTH = 6;

/* i campi sono descrittori, non markup: anagrafica e indirizzo condividono lo
   stesso form di modifica e si distinguono solo per questa lista */
export const IDENTITY_FIELDS = [
  { name: 'name', label: 'nome', autocomplete: 'given-name' },
  { name: 'surname', label: 'cognome', autocomplete: 'family-name' },
  { name: 'email', label: 'email', type: 'email', autocomplete: 'email' }
];

export const ADDRESS_FIELDS = [
  { name: 'street', label: 'via', autocomplete: 'address-line1' },
  { name: 'city', label: 'città', autocomplete: 'address-level2' },
  { name: 'zip', label: 'cap', autocomplete: 'postal-code' }
];

/* le preferenze ammesse dal backend sono un elenco chiuso (constants/preferences.js):
   qui le raggruppo per famiglia così la UI le presenta ordinate invece che in
   un unico blocco indistinto */
export const PREFERENCE_GROUPS = [
  {
    key: 'prodotto',
    label: 'tipologia di prodotto',
    values: ['vegetariano', 'vegano', 'senza_glutine', 'piccante']
  },
  {
    key: 'offerte',
    label: 'offerte speciali',
    values: ['offerte_speciali']
  },
  {
    key: 'esperienza',
    label: 'esperienza d’acquisto',
    values: ['consegna_rapida', 'ritiro_in_sede']
  }
];

export function preferenceLabel(value) {
  return String(value).replaceAll('_', ' ');
}

/* restituisce un oggetto di errori per campo: vuoto significa che i valori
   sono accettabili. il minimo è 6 caratteri, la stessa soglia usata dal
   backend su PUT /users/me (userValidation.js) */
export function passwordErrors({ password = '', confirmPassword = '' } = {}) {
  const errors = {};

  if (!password) {
    errors.password = 'nuova password richiesta';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `almeno ${MIN_PASSWORD_LENGTH} caratteri`;
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'le password non coincidono';
  }

  return errors;
}

/* le preferenze alimentari riguardano solo il cliente: manager e admin vedono
   solo i propri dati e la sicurezza */
export function profileSections(role) {
  const sections = [
    ['anagrafica', 'anagrafica'],
    ['indirizzo', 'indirizzo']
  ];

  if (role === 'customer') {
    sections.push(['preferenze', 'preferenze']);
  }

  sections.push(['sicurezza', 'sicurezza'], ['account', 'account']);

  return sections.map(([id, label], position) => ({
    id,
    label,
    index: String(position + 1).padStart(2, '0')
  }));
}

/* managerId arriva come oggetto popolato dalle liste e come stringa dai
   documenti grezzi: normalizzo entrambi i casi in un solo punto */
function branchOwnerId(restaurant) {
  const owner = restaurant?.managerId;
  if (!owner) return '';
  return typeof owner === 'object' ? userId(owner) : String(owner);
}

export function ownedBranches(restaurants = [], managerId = '') {
  return restaurants.filter(restaurant => branchOwnerId(restaurant) === String(managerId));
}

/* possibili subentranti quando un manager elimina l'account: i manager
   proprietari di altre filiali, senza duplicati e senza il manager uscente */
export function successorManagers(restaurants = [], managerId = '') {
  const successors = new Map();

  restaurants.forEach(restaurant => {
    const owner = restaurant?.managerId;
    if (!owner || typeof owner !== 'object') return;

    const id = userId(owner);
    if (!id || id === String(managerId) || successors.has(id)) return;

    successors.set(id, owner);
  });

  return [...successors.values()];
}
