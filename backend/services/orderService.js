const Order = require('../models/Order');
const Dish = require('../models/Dish');
const generateOrderCode = require('../utils/generateOrderCode');
const { isAdmin, isOwner, unauthorized } = require('../utils/authorization');
const { countsByKey } = require('../utils/aggregation');

/* logica di dominio degli ordini: creazione, autorizzazioni e avanzamento di
   stato (ordered -> preparing -> ready/on_delivery -> delivered). il
   controller resta responsabile solo di leggere la richiesta, chiamare
   queste funzioni e tradurne il risultato in una risposta http. */

// numero di piatti più venduti mostrati nella dashboard del manager
const TOP_DISHES_LIMIT = 5;

// unico stato che segna un ordine come concluso: usato sia per calcolare gli
// incassi della dashboard sia per distinguere, nella lista ordini del
// cliente, quelli "in corso" da quelli "passati"
const COMPLETED_STATUS = 'delivered';

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

/* un piatto è ordinabile in una filiale se è del menu comune (isCustom: false,
   valido per tutte le filiali) oppure se è un piatto custom di quella
   specifica filiale */
function belongsToRestaurantMenu(dish, restaurantId) {
  return !dish.isCustom || isOwner(dish.restaurantId, restaurantId);
}

/* verifica che tutti i piatti richiesti esistano e appartengano al menu del
   ristorante scelto, con un'unica query invece di una per riga ordine.
   ritorna il messaggio d'errore da mostrare, o null se tutto è valido */
async function validateOrderDishes(dishIds, restaurantId) {
  const dishes = await Dish.find({ _id: { $in: dishIds } });
  const dishById = new Map(dishes.map(dish => [dish._id.toString(), dish]));

  for (const dishId of dishIds) {
    const dish = dishById.get(dishId.toString());
    if (!dish) {
      return `Dish ${dishId} not found`;
    }
    if (!belongsToRestaurantMenu(dish, restaurantId)) {
      return `Dish ${dishId} is not part of this restaurant's menu`;
    }
  }

  return null;
}

/* crea un ordine per il cliente autenticato: verifica che i piatti richiesti
   siano ordinabili nella filiale scelta e genera il codice ordine lato
   server (mai fidarsi di uno eventualmente inviato dal client). il chiamante
   deve aver già verificato che il ristorante esista. ritorna { order } in
   caso di successo, oppure { error } con il messaggio da mostrare */
async function createOrder({ customerId, restaurantId, orderItems, mode, totalAmount, delivery }) {
  const dishIds = orderItems.map(item => item.dishId);
  const dishError = await validateOrderDishes(dishIds, restaurantId);
  if (dishError) {
    return { error: dishError };
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
  return { order: await populateOrderDetails(order) };
}

/* filtro per la lista ordini del cliente: 'past' isola gli ordini conclusi,
   'current' quelli ancora in corso; senza filtro restituisce tutti gli
   ordini del cliente (requirements.md §5) */
function buildUserOrdersFilter(customerId, statusFilter) {
  const filter = { customerId };

  if (statusFilter === 'past') {
    filter.status = COMPLETED_STATUS;
  } else if (statusFilter === 'current') {
    filter.status = { $ne: COMPLETED_STATUS };
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

// ordini di una filiale, paginati (solo manager proprietario o admin)
async function listRestaurantOrders(restaurantId, { skip, limit }) {
  const [total, orders] = await Promise.all([
    Order.countDocuments({ restaurantId }),
    populateOrderDetails(
      Order.find({ restaurantId })
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
  const [ordersByStatus, revenueResult, topDishes] = await Promise.all([
    Order.aggregate([
      { $match: { restaurantId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Order.aggregate([
      { $match: { restaurantId, status: COMPLETED_STATUS } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.aggregate([
      { $match: { restaurantId } },
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
  populateOrderDetails,
  findOrderWithRestaurant,
  checkOrderAccess,
  checkRestaurantOrdersAccess,
  validateOrderDishes,
  createOrder,
  listUserOrders,
  listRestaurantOrders,
  buildRestaurantDashboard
};
