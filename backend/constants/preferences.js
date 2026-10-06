/* elenco chiuso delle preferenze utente ammesse, raggruppate secondo le tre
   categorie descritte in requirements.md §3 (tipologie di prodotti preferiti,
   offerte speciali, preferenze legate all'esperienza d'acquisto). tenerle in
   un unico posto permette di riusare lo stesso elenco sia nell'enum del
   modello User sia nelle validazioni Joi, evitando che i due si disallineino. */

const PRODUCT_TYPE_PREFERENCES = ['vegetariano', 'vegano', 'senza_glutine', 'piccante'];
const OFFER_PREFERENCES = ['offerte_speciali'];
const EXPERIENCE_PREFERENCES = ['consegna_rapida', 'ritiro_in_sede'];

const ALLOWED_PREFERENCES = [
  ...PRODUCT_TYPE_PREFERENCES,
  ...OFFER_PREFERENCES,
  ...EXPERIENCE_PREFERENCES
];

module.exports = {
  PRODUCT_TYPE_PREFERENCES,
  OFFER_PREFERENCES,
  EXPERIENCE_PREFERENCES,
  ALLOWED_PREFERENCES
};
