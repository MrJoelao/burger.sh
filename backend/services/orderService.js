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

/* unico stato che segna un ordine come concluso: usato sia per calcolare gli
   incassi della dashboard sia per distinguere, nella lista ordini del
   cliente, quelli "in corso" da quelli "passati" */
const COMPLETED_STATUS = 'delivered';

/* stato del carrello prima della conferma dell'ordine (data-model.md §5):
   stessa collezione orders, nessuna tabella separata per il carrello */
const DRAFT_STATUS = 'draft';

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

// recupera i piatti richiesti in un'unica query, indicizzati per id come stringa
async function findDishesById(dishIds) {
  const dishes = await Dish.find({ _id: { $in: dishIds } });
  return new Map(dishes.map(dish => [dish._id.toString(), dish]));
}

/* prima riga d'ordine che fa riferimento a un piatto inesistente o non ordinabile
   nel ristorante scelto, o null se sono tutte valide. condivisa tra la validazione
   semplice (validateOrderDishes) e quella del carrello in bozza (resolveDraftItems) */
function findInvalidDishError(dishIds, dishById, restaurantId) {
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

/* verifica che tutti i piatti richiesti esistano e appartengano al menu del
   ristorante scelto. ritorna il messaggio d'errore da mostrare, o null se
   tutto è valido */
async function validateOrderDishes(dishIds, restaurantId) {
  const dishById = await findDishesById(dishIds);
  return findInvalidDishError(dishIds, dishById, restaurantId);
}

// somma quantity * unitPrice di ogni riga, usata per ricalcolare il totale del carrello
function sumOrderItems(orderItems) {
  return orderItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

/* valida i piatti richiesti per il carrello in bozza e calcola unitPrice come
   snapshot del prezzo attuale del piatto: il client indica solo dishId e
   quantity, mai un prezzo, per evitare di fidarsi di un totale calcolato lato
   client. ritorna { orderItems, totalAmount } oppure { error } */
async function resolveDraftItems(items, restaurantId) {
  const dishIds = items.map(item => item.dishId);
  const dishById = await findDishesById(dishIds);

  const error = findInvalidDishError(dishIds, dishById, restaurantId);
  if (error) {
    return { error };
  }

  const orderItems = items.map(item => ({
    dishId: item.dishId,
    quantity: item.quantity,
    unitPrice: dishById.get(item.dishId.toString()).price
  }));

  return { orderItems, totalAmount: sumOrderItems(orderItems) };
}

/* crea un ordine per il cliente autenticato: verifica che i piatti richiesti
   siano ordinabili nella filiale scelta e ricalcola sempre unitPrice e
   totalAmount dal prezzo reale del piatto (stessa logica di resolveDraftItems,
   usata dal carrello), così un eventuale unitPrice/totalAmount inviato dal
   client viene ignorato e non può essere manomesso per pagare meno del dovuto.
   il chiamante deve aver già verificato che il ristorante esista. ritorna
   { order } in caso di successo, oppure { error } con il messaggio da mostrare */
async function createOrder({ customerId, restaurantId, orderItems, mode, delivery }) {
  const resolved = await resolveDraftItems(orderItems, restaurantId);
  if (resolved.error) {
    return { error: resolved.error };
  }

  const orderData = {
    customerId,
    restaurantId,
    orderItems: resolved.orderItems,
    status: 'ordered',
    mode,
    totalAmount: resolved.totalAmount,
    orderCode: generateOrderCode()
  };

  // aggiungi delivery solo se mode è domicilio
  if (mode === 'delivery' && delivery) {
    orderData.delivery = delivery;
  }

  const order = await Order.create(orderData);
  return { order: await populateOrderDetails(order) };
}

// il carrello attivo del cliente: al più un ordine in stato draft per cliente
function findActiveDraft(customerId) {
  return Order.findOne({ customerId, status: DRAFT_STATUS });
}

/* aggiunge la riga (dishId, quantity) alla lista esistente, sommando la
   quantity se il piatto è già nel carrello invece di duplicare la riga */
function mergeOrderItem(items, { dishId, quantity }) {
  const index = items.findIndex(item => isOwner(item.dishId, dishId));
  if (index === -1) {
    return [...items, { dishId, quantity }];
  }

  const merged = [...items];
  merged[index] = { dishId, quantity: merged[index].quantity + quantity };
  return merged;
}

/* aggiunge un piatto al carrello in bozza del cliente autenticato: crea il
   carrello se non esiste ancora, per il ristorante indicato. un cliente ha al
   più un carrello attivo alla volta, quindi aggiungere un piatto di un altro
   ristorante è rifiutato finché il carrello corrente non viene svuotato o
   confermato. ritorna { order } oppure { error, statusCode } */
async function addDraftItem(customerId, { restaurantId, dishId, quantity }) {
  const draft = await findActiveDraft(customerId);

  if (draft && !isOwner(draft.restaurantId, restaurantId)) {
    return { error: 'You already have a draft order for another restaurant', statusCode: 409 };
  }

  const existingItems = draft
    ? draft.orderItems.map(item => ({ dishId: item.dishId, quantity: item.quantity }))
    : [];
  const items = mergeOrderItem(existingItems, { dishId, quantity });

  const resolved = await resolveDraftItems(items, restaurantId);
  if (resolved.error) {
    return { error: resolved.error, statusCode: 400 };
  }

  if (draft) {
    draft.orderItems = resolved.orderItems;
    draft.totalAmount = resolved.totalAmount;
    await draft.save();
    return { order: await populateOrderDetails(draft) };
  }

  const created = await Order.create({
    customerId,
    restaurantId,
    orderItems: resolved.orderItems,
    totalAmount: resolved.totalAmount,
    status: DRAFT_STATUS,
    orderCode: generateOrderCode()
  });
  return { order: await populateOrderDetails(created) };
}

// carrello in bozza del cliente autenticato, o un errore 404 se non esiste
async function getDraft(customerId) {
  const draft = await findActiveDraft(customerId);
  if (!draft) {
    return { error: 'No draft order found', statusCode: 404 };
  }

  return { order: await populateOrderDetails(draft) };
}

/* aggiorna la quantity di un piatto già presente nel carrello in bozza.
   ricalcola sempre totalAmount dal prezzo attuale del piatto */
async function updateDraftItemQuantity(customerId, dishId, quantity) {
  const draft = await findActiveDraft(customerId);
  if (!draft) {
    return { error: 'No draft order found', statusCode: 404 };
  }

  const index = draft.orderItems.findIndex(item => isOwner(item.dishId, dishId));
  if (index === -1) {
    return { error: 'Dish not found in draft order', statusCode: 404 };
  }

  const items = draft.orderItems.map((item, i) => ({
    dishId: item.dishId,
    quantity: i === index ? quantity : item.quantity
  }));

  const resolved = await resolveDraftItems(items, draft.restaurantId);
  if (resolved.error) {
    return { error: resolved.error, statusCode: 400 };
  }

  draft.orderItems = resolved.orderItems;
  draft.totalAmount = resolved.totalAmount;
  await draft.save();
  return { order: await populateOrderDetails(draft) };
}

// rimuove un piatto dal carrello in bozza, ricalcolando il totale sulle righe rimanenti
async function removeDraftItem(customerId, dishId) {
  const draft = await findActiveDraft(customerId);
  if (!draft) {
    return { error: 'No draft order found', statusCode: 404 };
  }

  const remainingItems = draft.orderItems
    .filter(item => !isOwner(item.dishId, dishId))
    .map(item => ({ dishId: item.dishId, quantity: item.quantity }));

  if (remainingItems.length === draft.orderItems.length) {
    return { error: 'Dish not found in draft order', statusCode: 404 };
  }

  if (remainingItems.length === 0) {
    draft.orderItems = [];
    draft.totalAmount = 0;
    await draft.save();
    return { order: await populateOrderDetails(draft) };
  }

  const resolved = await resolveDraftItems(remainingItems, draft.restaurantId);
  if (resolved.error) {
    return { error: resolved.error, statusCode: 400 };
  }

  draft.orderItems = resolved.orderItems;
  draft.totalAmount = resolved.totalAmount;
  await draft.save();
  return { order: await populateOrderDetails(draft) };
}

// elimina il carrello in bozza del cliente, senza lasciare ordini vuoti nella collezione
async function discardDraft(customerId) {
  const draft = await findActiveDraft(customerId);
  if (!draft) {
    return { error: 'No draft order found', statusCode: 404 };
  }

  await Order.deleteOne({ _id: draft._id });
  return {};
}

/* conferma il carrello in bozza: richiede mode (e delivery se a domicilio),
   dati non ancora noti finché il cliente non completa l'ordine, e rifiuta un
   carrello senza righe. da qui in poi l'ordine segue la state machine normale
   (isValidStatusTransition), a partire da "ordered" */
async function confirmDraft(customerId, { mode, delivery }) {
  const draft = await findActiveDraft(customerId);
  if (!draft) {
    return { error: 'No draft order found', statusCode: 404 };
  }

  if (draft.orderItems.length === 0) {
    return { error: 'Cannot confirm an empty draft order', statusCode: 400 };
  }

  draft.mode = mode;
  draft.status = 'ordered';
  draft.delivery = mode === 'delivery' && delivery ? delivery : null;
  await draft.save();

  return { order: await populateOrderDetails(draft) };
}

/* filtro per la lista ordini del cliente: 'past' isola gli ordini conclusi,
   'current' quelli ancora in corso; senza filtro restituisce tutti gli ordini
   effettivi del cliente (requirements.md §5). il carrello in bozza non è mai
   incluso: non è ancora un ordine, ha una sua rotta dedicata (GET /orders/draft) */
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
  populateOrderDetails,
  findOrderWithRestaurant,
  checkOrderAccess,
  checkRestaurantOrdersAccess,
  validateOrderDishes,
  createOrder,
  addDraftItem,
  getDraft,
  updateDraftItemQuantity,
  removeDraftItem,
  discardDraft,
  confirmDraft,
  listUserOrders,
  listRestaurantOrders,
  buildRestaurantDashboard
};
