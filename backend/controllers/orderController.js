const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const orderService = require('../services/orderService');
const { jsonOk, jsonError, jsonMessage, jsonPaginated, handleAuth } = require('../utils/httpResponses');
const { findOrThrow } = require('../utils/authorization');

/* controller degli ordini: legge la richiesta, delega la logica di dominio a
   orderService e traduce il risultato in una risposta http. le regole di
   accesso (cliente proprietario, manager della filiale, admin) e la state
   machine degli stati ordine vivono nel service, non qui. */

// create ordine
async function createOrder(req, res, next) {
  try {
    /* unitPrice e totalAmount inviati dal client vengono ignorati: il service
       li ricalcola sempre dal prezzo reale del piatto (vedi orderService.createOrder) */
    const { restaurantId, orderItems, mode, delivery } = req.validated;
    const customerId = req.user.id;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return jsonError(res, 400, 'Restaurant not found');
    }

    const result = await orderService.createOrder({ customerId, restaurant, orderItems, mode, delivery });
    if (result.error) {
      return jsonError(res, 400, result.error);
    }

    return jsonOk(res, 201, result.order);
  } catch (err) {
    next(err);
  }
}

/* carrello in bozza (data-model.md §5): il cliente aggiunge/rimuove piatti
   prima di confermare l'ordine. il client indica solo dishId/quantity, mai un
   prezzo: il totale è sempre calcolato dal service dal prezzo reale del piatto */
async function addDraftItem(req, res, next) {
  try {
    const { restaurantId, dishId, quantity } = req.validated;

    const result = await orderService.addDraftItem(req.user.id, { restaurantId, dishId, quantity });
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

// get carrello in bozza del cliente autenticato
async function getDraft(req, res, next) {
  try {
    const result = await orderService.getDraft(req.user.id);
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

// aggiorna la quantity di un piatto già presente nel carrello in bozza
async function updateDraftItem(req, res, next) {
  try {
    const { dishId } = req.params;
    const { quantity } = req.validated;

    const result = await orderService.updateDraftItemQuantity(req.user.id, dishId, quantity);
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

// rimuove un piatto dal carrello in bozza
async function removeDraftItem(req, res, next) {
  try {
    const { dishId } = req.params;

    const result = await orderService.removeDraftItem(req.user.id, dishId);
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

// elimina il carrello in bozza del cliente
async function discardDraft(req, res, next) {
  try {
    const result = await orderService.discardDraft(req.user.id);
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonMessage(res, 200, 'Draft order discarded');
  } catch (err) {
    next(err);
  }
}

// conferma il carrello in bozza: da qui diventa un ordine vero e proprio, in stato "ordered"
async function confirmDraft(req, res, next) {
  try {
    const { mode, delivery } = req.validated;

    const result = await orderService.confirmDraft(req.user.id, { mode, delivery });
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

// get ordini dell'utente loggato, paginati e opzionalmente filtrati per stato (in corso/passati)
async function getUserOrders(req, res, next) {
  try {
    const customerId = req.user.id;
    const { page, limit, skip } = req.pagination;
    const { status } = req.query;

    const { total, orders } = await orderService.listUserOrders(customerId, { statusFilter: status, skip, limit });

    return jsonPaginated(res, 200, page, limit, total, orders);
  } catch (err) {
    next(err);
  }
}

// get ordini del ristorante (solo manager della filiale)
async function getRestaurantOrders(req, res, next) {
  try {
    const { restaurantId } = req.params;
    const { page, limit, skip } = req.pagination;

    const restaurant = await findOrThrow(Restaurant.findById(restaurantId), 'Restaurant not found');

    const authCheck = orderService.checkRestaurantOrdersAccess(req.user, restaurant);
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    const { total, orders } = await orderService.listRestaurantOrders(restaurantId, { skip, limit });

    return jsonPaginated(res, 200, page, limit, total, orders);
  } catch (err) {
    next(err);
  }
}

// get ordine by id
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const order = await findOrThrow(orderService.populateOrderDetails(Order.findById(id)), 'Order not found');

    const authCheck = orderService.checkOrderAccess(req.user, order, 'view');
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

    const order = await findOrThrow(orderService.findOrderWithRestaurant(id), 'Order not found');

    const authCheck = orderService.checkOrderAccess(req.user, order, 'manage');
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    if (!orderService.isValidStatusTransition(order.mode, order.status, status)) {
      return jsonError(res, 400, `Cannot transition order from ${order.status} to ${status} for mode ${order.mode}`);
    }

    order.status = status;
    await order.save();

    const updatedOrder = await orderService.populateOrderDetails(order);

    return jsonOk(res, 200, updatedOrder);
  } catch (err) {
    next(err);
  }
}

// confirm consegna (cliente conferma ricezione)
async function confirmDelivery(req, res, next) {
  try {
    const { id } = req.params;

    const order = await findOrThrow(orderService.findOrderWithRestaurant(id), 'Order not found');

    const authCheck = orderService.checkOrderAccess(req.user, order, 'confirm_delivery');
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

    const updatedOrder = await orderService.populateOrderDetails(order);

    return jsonOk(res, 200, updatedOrder);
  } catch (err) {
    next(err);
  }
}

/* dashboard del manager per una filiale: ordini raggruppati per stato, incassi
   e piatti più venduti (requirements.md §4). riusa lo stesso controllo di
   autorizzazione già previsto per la lista ordini della filiale (manager
   proprietario o admin). */
async function getRestaurantDashboard(req, res, next) {
  try {
    const { restaurantId } = req.params;

    const restaurant = await findOrThrow(Restaurant.findById(restaurantId), 'Restaurant not found');

    const authCheck = orderService.checkRestaurantOrdersAccess(req.user, restaurant);
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    const dashboard = await orderService.buildRestaurantDashboard(restaurant._id);

    return jsonOk(res, 200, dashboard);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrder,
  addDraftItem,
  getDraft,
  updateDraftItem,
  removeDraftItem,
  discardDraft,
  confirmDraft,
  getUserOrders,
  getRestaurantOrders,
  getRestaurantDashboard,
  getOrderById,
  updateOrderStatus,
  confirmDelivery
};
