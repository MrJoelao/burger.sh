const Joi = require('joi');

const orderItemSchema = Joi.object({
  dishId: Joi.string().hex().length(24).required(),
  quantity: Joi.number().positive().required(),
  unitPrice: Joi.number().min(0).required()
});

/* distanceKm e deliveryFee non sono accettati dal client: sono sempre
   ricalcolati lato server da deliveryService a partire dall'indirizzo,
   sullo stesso principio già usato per unitPrice/totalAmount degli ordini */
const deliverySchema = Joi.object({
  address: Joi.string().min(2).trim().required()
})

/* customerId, orderCode, status e totalAmount non compaiono qui: il
   controller/service li calcola sempre lato server (req.user.id,
   generateOrderCode(), status fisso a 'ordered' alla creazione, totalAmount
   ricalcolato dal prezzo reale dei piatti in orderService.createOrder),
   quindi non vanno richiesti né accettati nel payload */
const createOrderSchema = Joi.object({
  restaurantId: Joi.string().hex().length(24).required(),
  orderItems: Joi.array().items(orderItemSchema).min(1).required(),
  mode: Joi.string().valid('pickup', 'delivery').required(),
  delivery: Joi.alternatives().conditional('mode', {
      is: 'delivery',
      then: deliverySchema.required(),
      otherwise: Joi.allow(null).forbidden()
    })
})

/* PATCH /orders/:id/status accetta solo lo status: un endpoint dedicato,
   piuttosto che uno schema di update generico, perché è l'unico campo che
   il controller usa davvero (nessuna rotta accetta un update libero di
   un intero ordine) */
const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('ordered', 'preparing', 'ready', 'on_delivery', 'delivered')
    .required()
});

/* carrello in bozza (data-model.md §5): il client indica solo dishId e
   quantity, mai un prezzo, che il server calcola sempre dal Dish reale */
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
  updateOrderStatusSchema,
  addDraftItemSchema,
  updateDraftItemSchema,
  confirmDraftSchema
};
