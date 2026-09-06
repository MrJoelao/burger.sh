const Joi = require('joi');

/* un manager gestisce incassi e ordini di una filiale reale, quindi richiede
   una password più lunga del minimo usato per i customer, sullo stesso
   principio già applicato all'admin (12 caratteri in seedAdmin.js) */
const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  surname: Joi.string().min(2).required(),
  email: Joi.string().email().trim().required(),
  password: Joi.string().when('role', {
    is: 'manager',
    then: Joi.string().min(12),
    otherwise: Joi.string().min(6)
  }).required(),
  role: Joi.string().valid('customer', 'manager').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().required(),
  password: Joi.string().required()
});

module.exports = { registerSchema, loginSchema };
