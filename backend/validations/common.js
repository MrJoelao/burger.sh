const Joi = require('joi');

/* schema dell'indirizzo, condiviso da tutte le validazioni che lo includono
   (registrazione, modifica profilo, modifica utente da parte dell'admin) */
const addressSchema = Joi.object({
  street: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  zip: Joi.string().optional().allow('')
});

module.exports = { addressSchema };
