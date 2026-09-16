const Joi = require('joi');

const createIngredientSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required()
});

module.exports = { createIngredientSchema };
