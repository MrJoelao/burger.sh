const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const generateOrderCode = require('../utils/generateOrderCode');
const { isAdmin, isOwner, unauthorized } = require('../utils/authorization');
const { jsonOk, jsonError, jsonPaginated, handleAuth } = require('../utils/httpResponses');

/* controller degli ordini: creazione, consultazione e avanzamento di stato
   (ordered -> preparing -> ready/on_delivery -> delivered), con regole di
   accesso diverse per cliente, manager del ristorante e admin. */

/* sequenza di stati ammessi per ogni modalità: il ritiro salta lo stato
   "on_delivery" (non c'è consegna), la modalità a domicilio salta "ready"
   (il cliente non ritira di persona). rappresenta l'intera state machine,
   non solo l'insieme di stati validi per la modalità */
const VALID_STATUS_TRANSITIONS = {
  pickup: ['ordered', 'preparing', 'ready', 'delivered'],
  delivery: ['ordered', 'preparing', 'on_delivery', 'delivered']
};

/* verifica che lo stato richiesto sia effettivamente il prossimo stato
   raggiungibile da quello corrente per la modalità dell'ordine, e non solo
   uno stato genericamente ammesso per quella modalità (altrimenti si
   potrebbero saltare stati, es. da "ordered" a "delivered", o tornare indietro) */
function isValidStatusTransition(mode, currentStatus, nextStatus) {
  const sequence = VALID_STATUS_TRANSITIONS[mode];
  if (!sequence) {
    return false;
  }

  const currentIndex = sequence.indexOf(currentStatus);
  const nextIndex = sequence.indexOf(nextStatus);

  return currentIndex !== -1 && nextIndex === currentIndex + 1;
}

/* aggiunge a un ordine i dati essenziali di cliente, ristorante e piatti,
   così la risposta al client è sempre completa senza ripetere la stessa
   catena di populate in ogni funzione. i populate multipli vanno passati
   in un unico array, perché concatenare più chiamate .populate() non è
   supportato dalla versione di mongoose in uso */
function populateOrderDetails(order) {
  return order.populate([
    { path: 'customerId', select: 'name surname email' },
    { path: 'restaurantId', select: 'name city managerId' },
    { path: 'orderItems.dishId', select: 'name price type' }
  ]);
}

/* recupera un ordine con il ristorante popolato, dato necessario ai controlli
   di autorizzazione manage e confirm_delivery. condivisa tra updateOrderStatus
   e confirmDelivery per non duplicare la stessa query */
function findOrderWithRestaurant(id) {
  return Order.findById(id).populate('restaurantId');
}

/* una strategia per ogni tipo di accesso a un ordine: aggiungerne una nuova
   non richiede toccare le altre (open/closed) */
const ORDER_ACCESS_CHECKS = {
  // chi può leggere un ordine: il cliente che lo ha creato, il manager del ristorante, o admin
  view(req, order) {
    // customerId e restaurantId sono documenti popolati: l'id è in _id, non nel documento stesso
    const isCustomer = isOwner(order.customerId._id, req.user.id);
    const isManager = isOwner(order.restaurantId.managerId, req.user.id);

    if (!isCustomer && !isManager && !isAdmin(req.user)) {
      // 404 per non rivelare l'esistenza
      return unauthorized('Order not found', 404);
    }
    return { authorized: true };
  },

  // chi può gestire lo stato di un ordine: il manager del ristorante o admin
  manage(req, order) {
    const isManager = isOwner(order.restaurantId.managerId, req.user.id);
    if (!isAdmin(req.user) && !isManager) {
      return unauthorized('Not authorized to update this order');
    }
    return { authorized: true };
  },

  // chi può confermare una consegna: solo il cliente che ha fatto l'ordine
  confirm_delivery(req, order) {
    if (!isOwner(order.customerId, req.user.id)) {
      return unauthorized('You are not authorized to confirm this order');
    }
    return { authorized: true };
  }
};

/* helper: verifica accesso agli ordini. accessType può essere 'view', 'manage'
   o 'confirm_delivery'; order deve avere customerId e restaurantId.managerId
   popolati. ritorna { authorized: boolean, statusCode: number, message: string } */
function checkOrderAccess(req, order, accessType) {
  const check = Object.hasOwn(ORDER_ACCESS_CHECKS, accessType) ? ORDER_ACCESS_CHECKS[accessType] : null;
  if (!check) {
    return unauthorized('Invalid access type', 400);
  }
  return check(req, order);
}

/* helper: verifica accesso agli ordini di un ristorante. ritorna
   { authorized: boolean, statusCode: number, message: string } */
function checkRestaurantOrdersAccess(req, restaurant) {
  // chi può vedere gli ordini di un ristorante: il manager del ristorante o admin
  if (!isAdmin(req.user) && !isOwner(restaurant.managerId, req.user.id)) {
    return unauthorized('Not authorized to view this restaurant\'s orders');
  }

  return { authorized: true };
}

// create ordine
async function createOrder(req, res, next) {
  try {
    const { restaurantId, orderItems, mode, totalAmount, delivery } = req.validated;
    const customerId = req.user.id;

    // verifica che il ristorante esista
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return jsonError(res, 400, 'Restaurant not found');
    }

    // verifica che tutti i piatti esistano con un'unica query, invece di una per riga ordine
    const dishIds = orderItems.map(item => item.dishId);
    const existingDishes = await Dish.find({ _id: { $in: dishIds } });
    const existingDishIds = new Set(existingDishes.map(dish => dish._id.toString()));

    const missingDishId = dishIds.find(dishId => !existingDishIds.has(dishId.toString()));
    if (missingDishId) {
      return jsonError(res, 400, `Dish ${missingDishId} not found`);
    }

    const orderData = {
      customerId,
      restaurantId,
      orderItems,
      status: 'ordered',
      mode,
      totalAmount,
      orderCode: generateOrderCode()
    };

    // aggiungi delivery solo se mode è domicilio
    if (mode === 'delivery' && delivery) {
      orderData.delivery = delivery;
    }

    const order = await Order.create(orderData);
    const populatedOrder = await populateOrderDetails(order);

    return jsonOk(res, 201, populatedOrder);
  } catch (err) {
    next(err);
  }
}

// get ordini dell'utente loggato
async function getUserOrders(req, res, next) {
  try {
    const customerId = req.user.id;

    const orders = await populateOrderDetails(Order.find({ customerId }).sort({ createdAt: -1 }));

    return jsonOk(res, 200, orders);
  } catch (err) {
    next(err);
  }
}

// get ordini del ristorante (solo manager della filiale)
async function getRestaurantOrders(req, res, next) {
  try {
    const { restaurantId } = req.params;
    const { page, limit, skip } = req.pagination;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return jsonError(res, 404, 'Restaurant not found');
    }

    // usa helper per verificare autorizzazione
    const authCheck = checkRestaurantOrdersAccess(req, restaurant);
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    const [total, orders] = await Promise.all([
      Order.countDocuments({ restaurantId }),
      populateOrderDetails(
        Order.find({ restaurantId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
      )
    ]);

    return jsonPaginated(res, 200, page, limit, total, orders);
  } catch (err) {
    next(err);
  }
}

// get ordine by id
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const order = await populateOrderDetails(Order.findById(id));

    if (!order) {
      return jsonError(res, 404, 'Order not found');
    }

    // usa helper per verificare autorizzazione
    const authCheck = checkOrderAccess(req, order, 'view');
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    return jsonOk(res, 200, order);
  } catch (err) {
    next(err);
  }
}

// update stato ordine (solo manager del ristorante o admin)
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.validated;

    const order = await findOrderWithRestaurant(id);
    if (!order) {
      return jsonError(res, 404, 'Order not found');
    }

    // usa helper per verificare autorizzazione
    const authCheck = checkOrderAccess(req, order, 'manage');
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    if (!isValidStatusTransition(order.mode, order.status, status)) {
      return jsonError(res, 400, `Cannot transition order from ${order.status} to ${status} for mode ${order.mode}`);
    }

    order.status = status;
    await order.save();

    const updatedOrder = await populateOrderDetails(order);

    return jsonOk(res, 200, updatedOrder);
  } catch (err) {
    next(err);
  }
}

// confirm consegna (cliente conferma ricezione)
async function confirmDelivery(req, res, next) {
  try {
    const { id } = req.params;

    const order = await findOrderWithRestaurant(id);
    if (!order) {
      return jsonError(res, 404, 'Order not found');
    }

    // usa helper per verificare autorizzazione
    const authCheck = checkOrderAccess(req, order, 'confirm_delivery');
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    if (order.mode !== 'delivery') {
      return jsonError(res, 400, 'Only delivery orders can be confirmed');
    }

    if (order.status !== 'on_delivery') {
      return jsonError(res, 400, 'Order must be on delivery status to confirm');
    }

    order.status = 'delivered';
    await order.save();

    const updatedOrder = await populateOrderDetails(order);

    return jsonOk(res, 200, updatedOrder);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  getUserOrders,
  getRestaurantOrders,
  getOrderById,
  updateOrderStatus,
  confirmDelivery
};
