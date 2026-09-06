const Joi = require('joi');
const { addressSchema } = require('./common');
const { ALLOWED_PREFERENCES } = require('../constants/preferences');

/* aggiornamento di un utente da parte dell'admin: oltre ai dati del profilo,
   può cambiare ruolo e stato di approvazione manager (approvazione o rifiuto
   dei manager pending, architecture-and-flows.md §8.6). newManagerId permette
   di trasferire la filiale di un manager declassato invece di chiuderla,
   stessa logica già usata da deleteAccountSchema */
const updateUserSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  surname: Joi.string().min(2).optional(),
  email: Joi.string().email().trim().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid('customer', 'manager', 'admin').optional(),
  managerStatus: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  newManagerId: Joi.string().hex().length(24).optional(),
  address: addressSchema.optional(),
  preferences: Joi.array().items(Joi.string().valid(...ALLOWED_PREFERENCES)).optional()
});

module.exports = { updateUserSchema };
