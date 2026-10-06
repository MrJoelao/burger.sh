const { badRequest } = require('./httpResponses');

/* funzioni di supporto per costruire i filtri di ricerca a partire dai
   parametri di query, condivise tra restaurantController e dishController
   per non duplicare la stessa logica di match testuale/numerico. */

/* contiene i caratteri speciali di una regex, da escapare prima di usare un
   valore fornito dal client come pattern (altrimenti un input come "a.b"
   verrebbe interpretato come regex invece che come testo letterale) */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* costruisce una regex per un match parziale case-insensitive (es. "burg"
   trova anche "Burger House"), oppure undefined se il valore non è stato
   passato, così il chiamante può ometterlo dal filtro senza controlli extra */
function containsFilter(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return new RegExp(escapeRegex(String(value).trim()), 'i');
}

/* converte un parametro di query opzionale in un numero non negativo,
   lanciando un errore 400 se il valore è presente ma non valido */
function parseNonNegativeNumber(value, fieldName) {
  if (value === undefined) {
    return undefined;
  }

  const number = Number(value);
  if (Number.isNaN(number) || number < 0) {
    throw badRequest(`${fieldName} must be a non-negative number`);
  }

  return number;
}

/* combina un array di condizioni di filtro Mongoose in un unico filtro:
   nessuna condizione produce {}, una sola condizione resta invariata, più
   condizioni vengono unite con $and (necessario quando più condizioni
   insistono sullo stesso campo, es. ingredientIds con $in e $nin) */
function combineFilters(conditions) {
  if (conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { $and: conditions };
}

module.exports = {
  escapeRegex,
  containsFilter,
  parseNonNegativeNumber,
  combineFilters
};
