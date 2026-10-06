const Joi = require('joi');

const createDishSchema = Joi.object({
  name: Joi.string().min(2).required(),
  type: Joi.string().min(2).required(),
  price: Joi.number().positive().required(),
  photoUrl: Joi.string().uri().optional().allow(''),
  ingredientIds: Joi.array()
      .items(Joi.string().hex().length(24))
      .optional(),
  isCustom: Joi.boolean().optional(),
  restaurantId: Joi.string()
    .hex()
    .length(24)
    .when('isCustom', { is: true, then: Joi.required(), otherwise: Joi.allow(null) })
});

const updateDishSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  type: Joi.string().min(2).optional(),
  price: Joi.number().positive().optional(),
  photoUrl: Joi.string().uri().optional().allow(''),
  ingredientIds: Joi.array()
      .items(Joi.string().hex().length(24))
      .optional(),
  isCustom: Joi.boolean().optional(),
  restaurantId: Joi.string().hex().length(24).optional()
});

module.exports = { createDishSchema, updateDishSchema };
