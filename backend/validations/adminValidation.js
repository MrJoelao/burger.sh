const Joi = require('joi');
const { addressSchema } = require('./common');
const { ALLOWED_PREFERENCES } = require('../constants/preferences');

/* aggiornamento di un utente da parte dell'admin: oltre ai dati del profilo,
   può cambiare ruolo e stato di approvazione manager (approvazione dei manager pending) */
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  surname: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid('customer', 'manager', 'admin').optional(),
  managerStatus: Joi.string().valid('pending', 'approved').optional(),
  address: addressSchema.optional(),
  preferences: Joi.array().items(Joi.string().valid(...ALLOWED_PREFERENCES)).optional()
});

module.exports = { updateUserSchema };
