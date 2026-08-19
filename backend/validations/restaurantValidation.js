const Joi = require('joi');

const createRestaurantSchema = Joi.object({
  name: Joi.string().min(2).required(),
  address: Joi.string().min(5).required(),
  city: Joi.string().min(2).required(),
  phone: Joi.string().pattern(/^\+?[0-9\s\-()]+$/).required(),
  vatNumber: Joi.string().required(),
  managerId: Joi.string().hex().length(24).required()
});

const updateRestaurantSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  address: Joi.string().min(5).optional(),
  city: Joi.string().min(2).optional(),
  phone: Joi.string().pattern(/^\+?[0-9\s\-()]+$/).optional(),
  vatNumber: Joi.string().optional(),
  managerId: Joi.string().hex().length(24).optional()
});

module.exports = { createRestaurantSchema, updateRestaurantSchema };
