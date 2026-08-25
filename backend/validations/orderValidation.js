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

// customerId e orderCode non compaiono qui: il controller li calcola sempre
// lato server (req.user.id e generateOrderCode()), quindi non vanno richiesti
// né accettati nel payload
const createOrderSchema = Joi.object({
  restaurantId: Joi.string().hex().length(24).required(),
  orderItems: Joi.array().items(orderItemSchema).min(1).required(),
  status: Joi.string()
      .valid('ordered', 'preparing', 'ready', 'on_delivery', 'delivered')
      .optional(),
  mode: Joi.string().valid('pickup', 'delivery'),
  totalAmount: Joi.number().min(0).required(),
  delivery: Joi.alternatives().conditional('mode', {
      is: 'delivery',
      then: deliverySchema.required(),
      otherwise: Joi.allow(null).forbidden()
    })
})

const updateOrderSchema = Joi.object({
  customerId: Joi.string().hex().length(24).optional(),
  restaurantId: Joi.string().hex().length(24).optional(),
  orderItems: Joi.array().items(orderItemSchema).min(1).optional(),
  status: Joi.string()
    .valid('ordered', 'preparing', 'ready', 'on_delivery', 'delivered')
    .optional(),
  mode: Joi.string().valid('pickup', 'delivery').optional(),
  totalAmount: Joi.number().min(0).optional(),
  orderCode: Joi.string().trim().optional(),
  delivery: Joi.alternatives().conditional('mode', {
    is: 'delivery',
    then: deliverySchema.optional(),
    otherwise: Joi.allow(null).forbidden()
  })
});

// carrello in bozza (data-model.md §5): il client indica solo dishId e
// quantity, mai un prezzo, che il server calcola sempre dal Dish reale
const addDraftItemSchema = Joi.object({
  restaurantId: Joi.string().hex().length(24).required(),
  dishId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required()
});

const updateDraftItemSchema = Joi.object({
  quantity: Joi.number().positive().required()
});

// conferma del carrello: mode e delivery si specificano solo qui, non alla creazione del carrello
const confirmDraftSchema = Joi.object({
  mode: Joi.string().valid('pickup', 'delivery').required(),
  delivery: Joi.alternatives().conditional('mode', {
    is: 'delivery',
    then: deliverySchema.required(),
    otherwise: Joi.allow(null).forbidden()
  })
});

module.exports = {
  orderItemSchema,
  deliverySchema,
  createOrderSchema,
  updateOrderSchema,
  addDraftItemSchema,
  updateDraftItemSchema,
  confirmDraftSchema
};
