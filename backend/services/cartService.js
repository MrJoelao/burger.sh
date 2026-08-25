const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { isOwner } = require('../utils/authorization');
const { DRAFT_STATUS } = require('../constants/orderStatus');
const { resolveOrderItems, createOrderWithUniqueCode, populateOrderDetails } = require('./orderRecordService');
const deliveryService = require('./deliveryService');

/* logica di dominio del carrello: rappresentato dalla stessa collezione
   orders usata dagli ordini confermati (status 'draft', data-model.md §5),
   ma con un ciclo di vita completamente diverso, quindi vive in un modulo
   separato da orderService. la costruzione/validazione delle righe e la
   creazione del documento restano condivise tramite orderRecordService. */

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
async function addItem(customerId, { restaurantId, dishId, quantity }) {
  const draft = await findActiveDraft(customerId);

  if (draft && !isOwner(draft.restaurantId, restaurantId)) {
    return { error: 'You already have a draft order for another restaurant', statusCode: 409 };
  }

  const existingItems = draft
    ? draft.orderItems.map(item => ({ dishId: item.dishId, quantity: item.quantity }))
    : [];
  const items = mergeOrderItem(existingItems, { dishId, quantity });

  const resolved = await resolveOrderItems(items, restaurantId);
  if (resolved.error) {
    return { error: resolved.error, statusCode: 400 };
  }

  if (draft) {
    draft.orderItems = resolved.orderItems;
    draft.totalAmount = resolved.totalAmount;
    await draft.save();
    return { order: await populateOrderDetails(draft) };
  }

  const created = await createOrderWithUniqueCode({
    customerId,
    restaurantId,
    orderItems: resolved.orderItems,
    totalAmount: resolved.totalAmount,
    status: DRAFT_STATUS
  });
  return { order: await populateOrderDetails(created) };
}

// carrello in bozza del cliente autenticato, o un errore 404 se non esiste
async function getCart(customerId) {
  const draft = await findActiveDraft(customerId);
  if (!draft) {
    return { error: 'No draft order found', statusCode: 404 };
  }

  return { order: await populateOrderDetails(draft) };
}

/* aggiorna la quantity di un piatto già presente nel carrello in bozza.
   ricalcola sempre totalAmount dal prezzo attuale del piatto */
async function updateItemQuantity(customerId, dishId, quantity) {
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

  const resolved = await resolveOrderItems(items, draft.restaurantId);
  if (resolved.error) {
    return { error: resolved.error, statusCode: 400 };
  }

  draft.orderItems = resolved.orderItems;
  draft.totalAmount = resolved.totalAmount;
  await draft.save();
  return { order: await populateOrderDetails(draft) };
}

// rimuove un piatto dal carrello in bozza, ricalcolando il totale sulle righe rimanenti
async function removeItem(customerId, dishId) {
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

  const resolved = await resolveOrderItems(remainingItems, draft.restaurantId);
  if (resolved.error) {
    return { error: resolved.error, statusCode: 400 };
  }

  draft.orderItems = resolved.orderItems;
  draft.totalAmount = resolved.totalAmount;
  await draft.save();
  return { order: await populateOrderDetails(draft) };
}

// elimina il carrello in bozza del cliente, senza lasciare ordini vuoti nella collezione
async function discardCart(customerId) {
  const draft = await findActiveDraft(customerId);
  if (!draft) {
    return { error: 'No draft order found', statusCode: 404 };
  }

  await Order.deleteOne({ _id: draft._id });
  return {};
}

/* conferma il carrello in bozza: richiede mode (e delivery se a domicilio),
   dati non ancora noti finché il cliente non completa l'ordine, e rifiuta un
   carrello senza righe. per mode "delivery" ricalcola sempre distanceKm e
   deliveryFee dall'indirizzo tramite deliveryService, ignorando eventuali
   valori inviati dal client. da qui in poi l'ordine segue la state machine
   normale di orderService.isValidStatusTransition, a partire da "ordered" */
async function confirmCart(customerId, { mode, delivery }) {
  const draft = await findActiveDraft(customerId);
  if (!draft) {
    return { error: 'No draft order found', statusCode: 404 };
  }

  if (draft.orderItems.length === 0) {
    return { error: 'Cannot confirm an empty draft order', statusCode: 400 };
  }

  draft.mode = mode;
  draft.status = 'ordered';

  if (mode === 'delivery' && delivery) {
    const restaurant = await Restaurant.findById(draft.restaurantId);
    const { distanceKm, deliveryFee } = await deliveryService.calculateDelivery(restaurant, delivery.address);
    draft.delivery = { address: delivery.address, distanceKm, deliveryFee };
  } else {
    draft.delivery = null;
  }

  await draft.save();

  return { order: await populateOrderDetails(draft) };
}

module.exports = {
  addItem,
  getCart,
  updateItemQuantity,
  removeItem,
  discardCart,
  confirmCart
};
