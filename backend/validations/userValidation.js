const Joi = require('joi');
const { addressSchema } = require('./common');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  surname: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('customer', 'manager', 'admin').required(),
  address: addressSchema.optional(),
  preferences: Joi.array().items(Joi.string()).optional()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  surname: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  address: addressSchema.optional(),
  preferences: Joi.array().items(Joi.string()).optional()
});

// usato per eliminare il proprio account: se chi si elimina è un manager proprietario
// di una filiale, newManagerId permette di trasferirla invece di chiuderla
const deleteAccountSchema = Joi.object({
  newManagerId: Joi.string().hex().length(24).optional()
});

module.exports = {registerSchema, updateProfileSchema, deleteAccountSchema};
