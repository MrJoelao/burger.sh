const Joi = require('joi');

const orderItemSchema = Joi.object({
  dishId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required(),
  unitPrice: Joi.number().min(0).required()
});

const deliverySchema = Joi.object({
  address: Joi.string().min(2).trim().required(),
  distanceKm: Joi.number().min(0).optional(),
  deliveryFee: Joi.number().min(0).optional()
})

const createOrderSchema = Joi.object({
  customerId: Joi.string().hex().length(24).required(),
  restaurantId: Joi.string().hex().length(24).required(),
  orderItems: Joi.array().items(orderItemSchema).min(1).required(),
  status: Joi.string()
      .valid('ordinato', 'in preparazione', 'pronto', 'in consegna', 'consegnato')
      .optional(),
  mode: Joi.string().valid('ritiro', 'domicilio'),
  totalAmount: Joi.number().min(0).required(),
  orderCode: Joi.string().trim().required(),
  delivery: Joi.alternatives().conditional('mode', {
      is: 'domicilio',
      then: deliverySchema.required(),
      otherwise: Joi.allow(null).forbidden()
    })
})

const updateOrderSchema = Joi.object({
  customerId: Joi.string().hex().length(24).optional(),
  restaurantId: Joi.string().hex().length(24).optional(),
  orderItems: Joi.array().items(orderItemSchema).min(1).optional(),
  status: Joi.string()
    .valid('ordinato', 'in preparazione', 'pronto', 'in consegna', 'consegnato')
    .optional(),
  mode: Joi.string().valid('ritiro', 'domicilio').optional(),
  totalAmount: Joi.number().min(0).optional(),
  orderCode: Joi.string().trim().optional(),
  delivery: Joi.alternatives().conditional('mode', {
    is: 'domicilio',
    then: deliverySchema.optional(),
    otherwise: Joi.allow(null).forbidden()
  })
});

module.exports = {orderItemSchema, deliverySchema, createOrderSchema, updateOrderSchema};
