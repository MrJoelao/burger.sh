const Joi = require('joi');
const { deliverySchema } = require('./common');

/* carrello in bozza (data-model.md §5): il client indica solo dishId e
   quantity, mai un prezzo, che il server calcola sempre dal Dish reale */
const addCartItemSchema = Joi.object({
  restaurantId: Joi.string().hex().length(24).required(),
  dishId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required()
});

const updateCartItemSchema = Joi.object({
  quantity: Joi.number().positive().required()
});

// conferma del carrello: mode e delivery si specificano solo qui, non alla creazione del carrello
const confirmCartSchema = Joi.object({
  mode: Joi.string().valid('pickup', 'delivery').required(),
  delivery: Joi.alternatives().conditional('mode', {
    is: 'delivery',
    then: deliverySchema.required(),
    otherwise: Joi.allow(null).forbidden()
  })
});

module.exports = { addCartItemSchema, updateCartItemSchema, confirmCartSchema };
