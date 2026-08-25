const Joi = require('joi');

/* schema dell'indirizzo, condiviso da tutte le validazioni che lo includono
   (registrazione, modifica profilo, modifica utente da parte dell'admin) */
const addressSchema = Joi.object({
  street: Joi.string().optional().allow(''),
  city: Joi.string().optional().allow(''),
  zip: Joi.string().optional().allow('')
});

/* indirizzo di consegna, condiviso tra la creazione diretta di un ordine
   (orderValidation) e la conferma del carrello (cartValidation): distanza e
   costo non sono mai accettati dal client, sono sempre ricalcolati lato
   server da deliveryService a partire da questo indirizzo */
const deliverySchema = Joi.object({
  address: Joi.string().min(2).trim().required()
});

module.exports = { addressSchema, deliverySchema };
