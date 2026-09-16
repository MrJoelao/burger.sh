const Joi = require('joi');

const locationSchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required()
});

const createRestaurantSchema = Joi.object({
  name: Joi.string().min(2).required(),
  address: Joi.string().min(5).required(),
  city: Joi.string().min(2).required(),
  zip: Joi.string().pattern(/^\d{5}$/).optional(),
  phone: Joi.string().pattern(/^\+?[0-9\s\-()]+$/).required(),
  vatNumber: Joi.string().required(),
  managerId: Joi.string().hex().length(24).required(),
  location: locationSchema.optional()
});

const createFirstRestaurantSchema = Joi.object({
  name: Joi.string().min(2).required(),
  address: Joi.string().min(5).required(),
  city: Joi.string().min(2).required(),
  zip: Joi.string().pattern(/^\d{5}$/).optional(),
  phone: Joi.string().pattern(/^\+?[0-9\s\-()]+$/).required(),
  vatNumber: Joi.string().required(),
  location: locationSchema.optional()
});

const updateRestaurantSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  address: Joi.string().min(5).optional(),
  city: Joi.string().min(2).optional(),
  zip: Joi.string().pattern(/^\d{5}$/).optional(),
  phone: Joi.string().pattern(/^\+?[0-9\s\-()]+$/).optional(),
  vatNumber: Joi.string().optional(),
  managerId: Joi.string().hex().length(24).optional(),
  location: locationSchema.optional()
});

module.exports = { createRestaurantSchema, createFirstRestaurantSchema, updateRestaurantSchema };
