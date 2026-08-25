const Joi = require('joi');
const { addressSchema } = require('./common');
const { ALLOWED_PREFERENCES } = require('../constants/preferences');

// elenco chiuso: solo i valori definiti in constants/preferences.js sono ammessi
const preferencesSchema = Joi.array().items(Joi.string().valid(...ALLOWED_PREFERENCES)).optional();

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  surname: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('customer', 'manager', 'admin').required(),
  address: addressSchema.optional(),
  preferences: preferencesSchema
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  surname: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  address: addressSchema.optional(),
  preferences: preferencesSchema
});

// usato per eliminare il proprio account: se chi si elimina è un manager proprietario
// di una filiale, newManagerId permette di trasferirla invece di chiuderla
const deleteAccountSchema = Joi.object({
  newManagerId: Joi.string().hex().length(24).optional()
});

module.exports = {registerSchema, updateProfileSchema, deleteAccountSchema};
