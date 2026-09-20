const Joi = require('joi');

const createIngredientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  allergens: Joi.array().items(Joi.string().trim().min(2).max(40)).max(20).default([])
});

module.exports = { createIngredientSchema };
