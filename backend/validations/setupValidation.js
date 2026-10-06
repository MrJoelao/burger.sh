const Joi = require('joi');

/* dati raccolti al primo avvio: l'email e i contatti arrivano dall'utente e
   vengono salvati sull'admin, mentre la password provvisoria resta generata
   dal backend, quindi non compare nello schema. */
const setupSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().trim().min(2).required(),
  surname: Joi.string().trim().min(2).required(),
  address: Joi.object({
    street: Joi.string().trim().allow(''),
    city: Joi.string().trim().allow(''),
    zip: Joi.string().trim().allow('')
  }),
  pin: Joi.string()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

module.exports = { setupSchema, changePasswordSchema };
