const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  surname: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('customer', 'manager', 'admin').required(),
  address: Joi.object({
    street: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    zip: Joi.string().optional().allow('')
  }).optional(),
  preferences: Joi.array().items(Joi.string()).optional()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  surname: Joi.string().min(2).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  address: Joi.object({
    street: Joi.string().optional().allow(''),
    city: Joi.string().optional().allow(''),
    zip: Joi.string().optional().allow('')
  }).optional(),
  preferences: Joi.array().items(Joi.string()).optional()
});

module.exports = {registerSchema, updateProfileSchema};
