const Joi = require('joi');

// per type 'card' i dettagli sono le sole ultime 4 cifre della carta (mai il numero completo)
const cardDetails = Joi.string().pattern(/^\d{4}$/).messages({
  'string.pattern.base': 'details must be the last 4 digits of the card'
});

const createPaymentMethodSchema = Joi.object({
  type: Joi.string().valid('card', 'cash').required(),
  label: Joi.string().min(2).optional(),
  details: cardDetails.when('type', { is: 'card', then: Joi.required(), otherwise: Joi.forbidden() }),
  isDefault: Joi.boolean().optional()
});

const updatePaymentMethodSchema = Joi.object({
  label: Joi.string().min(2).optional(),
  details: cardDetails.optional(),
  isDefault: Joi.boolean().optional()
});

module.exports = { createPaymentMethodSchema, updatePaymentMethodSchema };
