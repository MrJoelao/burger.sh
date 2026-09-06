const Joi = require('joi');
const { addressSchema } = require('./common');
const { ALLOWED_PREFERENCES } = require('../constants/preferences');

// elenco chiuso: solo i valori definiti in constants/preferences.js sono ammessi
const preferencesSchema = Joi.array().items(Joi.string().valid(...ALLOWED_PREFERENCES)).optional();

/* 'admin' non è tra i ruoli ammessi in autoregistrazione: un utente non deve
   potersi promuovere admin da solo, quel ruolo si assegna solo manualmente
   tramite adminController (stessa regola già applicata in authValidation.js) */
/* un manager gestisce incassi e ordini di una filiale reale, quindi richiede
   una password più lunga del minimo usato per i customer, sullo stesso
   principio già applicato all'admin (12 caratteri in seedAdmin.js) e in
   authValidation.js */
const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  surname: Joi.string().min(2).required(),
  email: Joi.string().email().trim().required(),
  password: Joi.string().when('role', {
    is: 'manager',
    then: Joi.string().min(8),
    otherwise: Joi.string().min(6)
  }).required(),
  role: Joi.string().valid('customer', 'manager').required(),
  address: addressSchema.optional(),
  preferences: preferencesSchema
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  surname: Joi.string().min(2).optional(),
  email: Joi.string().email().trim().optional(),
  password: Joi.string().min(6).optional(),
  address: addressSchema.optional(),
  preferences: preferencesSchema
});

/* usato per eliminare il proprio account: se chi si elimina è un manager proprietario
   di una filiale, newManagerId permette di trasferirla invece di chiuderla */
const deleteAccountSchema = Joi.object({
  newManagerId: Joi.string().hex().length(24).optional()
});

module.exports = {registerSchema, updateProfileSchema, deleteAccountSchema};
