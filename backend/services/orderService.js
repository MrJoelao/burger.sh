const Order = require('../models/Order');
const { isAdmin, isOwner, unauthorized } = require('../utils/authorization');
const { countsByKey } = require('../utils/aggregation');
const { DRAFT_STATUS, COMPLETED_STATUS } = require('../constants/orderStatus');
const { resolveOrderItems, createOrderWithUniqueCode, populateOrderDetails } = require('./orderRecordService');
const deliveryService = require('./deliveryService');

/* logica di dominio degli ordini confermati: creazione, autorizzazioni e
   avanzamento di stato (ordered -> preparing -> ready/on_delivery ->
   delivered). il controller resta responsabile solo di leggere la
   richiesta, chiamare queste funzioni e tradurne il risultato in una
   risposta http. il carrello in bozza (stesso modello Order, status
   'draft') ha un ciclo di vita diverso e vive in cartService.js. */

// numero di piatti più venduti mostrati nella dashboard del manager
const TOP_DISHES_LIMIT = 5;

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
  view(user, order) {
    // customerId e restaurantId sono documenti popolati: l'id è in _id, non nel documento stesso
    const isCustomer = isOwner(order.customerId._id, user.id);
    const isManager = isOwner(order.restaurantId.managerId, user.id);

    if (!isCustomer && !isManager && !isAdmin(user)) {
      // 404 per non rivelare l'esistenza
      return unauthorized('Order not found', 404);
    }
    return { authorized: true };
  },

  // chi può gestire lo stato di un ordine: il manager del ristorante o admin
  manage(user, order) {
    const isManager = isOwner(order.restaurantId.managerId, user.id);
    if (!isAdmin(user) && !isManager) {
      return unauthorized('Not authorized to update this order');
    }
    return { authorized: true };
  },

  // chi può confermare una consegna: solo il cliente che ha fatto l'ordine
  confirm_delivery(user, order) {
    if (!isOwner(order.customerId, user.id)) {
      return unauthorized('You are not authorized to confirm this order');
    }
    return { authorized: true };
  }
};

/* verifica accesso a un ordine. accessType può essere 'view', 'manage'
   o 'confirm_delivery'; order deve avere customerId e restaurantId.managerId
   popolati. ritorna { authorized: boolean, statusCode: number, message: string } */
function checkOrderAccess(user, order, accessType) {
  const check = Object.hasOwn(ORDER_ACCESS_CHECKS, accessType) ? ORDER_ACCESS_CHECKS[accessType] : null;
  if (!check) {
    return unauthorized('Invalid access type', 400);
  }
  return check(user, order);
}

/* verifica accesso agli ordini di un ristorante. ritorna
   { authorized: boolean, statusCode: number, message: string } */
function checkRestaurantOrdersAccess(user, restaurant) {
  // chi può vedere gli ordini di un ristorante: il manager del ristorante o admin
  if (!isAdmin(user) && !isOwner(restaurant.managerId, user.id)) {
    return unauthorized('Not authorized to view this restaurant\'s orders');
  }

  return { authorized: true };
}

/* crea un ordine per il cliente autenticato: verifica che i piatti richiesti
   siano ordinabili nella filiale scelta e ricalcola sempre unitPrice e
   totalAmount dal prezzo reale del piatto (orderRecordService.resolveOrderItems,
   condiviso col carrello), così un eventuale unitPrice/totalAmount inviato dal
   client viene ignorato e non può essere manomesso per pagare meno del dovuto.
   il chiamante deve aver già verificato che il ristorante esista e passare il
   documento completo (non solo l'id): serve a deliveryService per calcolare
   distanceKm/deliveryFee dall'indirizzo del cliente, ignorando allo stesso
   modo eventuali valori inviati dal client. ritorna { order } in caso di
   successo, oppure { error } con il messaggio da mostrare */
async function createOrder({ customerId, restaurant, orderItems, mode, delivery }) {
  const resolved = await resolveOrderItems(orderItems, restaurant._id);
  if (resolved.error) {
    return { error: resolved.error };
  }

  const orderData = {
    customerId,
    restaurantId: restaurant._id,
    orderItems: resolved.orderItems,
    status: 'ordered',
    mode,
    totalAmount: resolved.totalAmount
  };

  if (mode === 'delivery' && delivery) {
    const { distanceKm, deliveryFee } = await deliveryService.calculateDelivery(restaurant, delivery.address);
    orderData.delivery = { address: delivery.address, distanceKm, deliveryFee };
  }

  const order = await createOrderWithUniqueCode(orderData);
  return { order: await populateOrderDetails(order) };
}

/* filtro per la lista ordini del cliente: 'past' isola gli ordini conclusi,
   'current' quelli ancora in corso; senza filtro restituisce tutti gli ordini
   effettivi del cliente (requirements.md §5). il carrello in bozza non è mai
   incluso: non è ancora un ordine, ha una sua rotta dedicata in cartRoutes.js */
function buildUserOrdersFilter(customerId, statusFilter) {
  const filter = { customerId, status: { $ne: DRAFT_STATUS } };

  if (statusFilter === 'past') {
    filter.status = COMPLETED_STATUS;
  } else if (statusFilter === 'current') {
    filter.status = { $nin: [COMPLETED_STATUS, DRAFT_STATUS] };
  }

  return filter;
}

/* ordini del cliente autenticato, paginati e opzionalmente filtrati per
   stato (in corso/passati) */
async function listUserOrders(customerId, { statusFilter, skip, limit }) {
  const filter = buildUserOrdersFilter(customerId, statusFilter);

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    populateOrderDetails(
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    )
  ]);

  return { total, orders };
}

/* ordini di una filiale, paginati (solo manager proprietario o admin). i
   carrelli in bozza dei clienti non sono ancora ordini reali e restano esclusi */
async function listRestaurantOrders(restaurantId, { skip, limit }) {
  const filter = { restaurantId, status: { $ne: DRAFT_STATUS } };

  const [total, orders] = await Promise.all([
    Order.countDocuments(filter),
    populateOrderDetails(
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    )
  ]);

  return { total, orders };
}

/* dashboard del manager per una filiale: ordini raggruppati per stato, incassi
   (somma degli ordini consegnati) e i piatti più venduti (requirements.md §4) */
async function buildRestaurantDashboard(restaurantId) {
  // i carrelli in bozza restano esclusi dalla dashboard: non sono ancora ordini reali
  const placedOrdersMatch = { restaurantId, status: { $ne: DRAFT_STATUS } };

  const [ordersByStatus, revenueResult, topDishes] = await Promise.all([
    Order.aggregate([
      { $match: placedOrdersMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { restaurantId, status: COMPLETED_STATUS } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { $match: placedOrdersMatch },
      { $unwind: '$orderItems' },
      { $group: { _id: '$orderItems.dishId', quantitySold: { $sum: '$orderItems.quantity' } } },
      { $sort: { quantitySold: -1 } },
      { $limit: TOP_DISHES_LIMIT },
      { $lookup: { from: 'dishes', localField: '_id', foreignField: '_id', as: 'dish' } },
      { $unwind: '$dish' },
      { $project: { _id: 0, dishId: '$_id', name: '$dish.name', quantitySold: 1 } }
    ])
  ]);

  return {
    ordersByStatus: countsByKey(ordersByStatus),
    revenue: revenueResult[0]?.total || 0,
    topDishes
  };
}

module.exports = {
  isValidStatusTransition,
  findOrderWithRestaurant,
  checkOrderAccess,
  checkRestaurantOrdersAccess,
  createOrder,
  listUserOrders,
  listRestaurantOrders,
  buildRestaurantDashboard
};
