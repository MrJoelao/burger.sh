const Order = require('../models/Order');
const Dish = require('../models/Dish');
const generateOrderCode = require('../utils/generateOrderCode');
const { isOwner } = require('../utils/authorization');

/* costruzione e persistenza di un documento Order a partire dalle righe
   richieste dal cliente: risoluzione/validazione dei piatti, calcolo del
   prezzo reale, creazione con codice ordine univoco e popolamento dei
   riferimenti. condiviso da orderService (ordini creati direttamente) e
   cartService (carrello in bozza), che si limitano a decidere quando
   chiamare queste funzioni, non come costruire il documento. */

/* generateOrderCode produce un codice casuale su un alfabeto di 36 caratteri
   e 6 posizioni: la probabilità di collisione è bassissima ma non nulla, e
   senza un retry esplicito la create() fallirebbe con un errore mongo 500
   non gestito. questo numero di tentativi rende la collisione persistente
   (e quindi l'errore restituito al client) un evento praticamente impossibile */
const MAX_ORDER_CODE_ATTEMPTS = 5;

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

/* prima riga d'ordine che fa riferimento a un piatto inesistente o non
   ordinabile nella filiale scelta, o null se sono tutte valide */
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

// somma quantity * unitPrice di ogni riga, usata per ricalcolare il totale dell'ordine/carrello
function sumOrderItems(orderItems) {
  return orderItems.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
}

/* valida i piatti richiesti (ordine diretto o carrello) e calcola unitPrice
   come snapshot del prezzo attuale del piatto: il client indica solo dishId
   e quantity, mai un prezzo, per evitare di fidarsi di un totale calcolato
   lato client. ritorna { orderItems, totalAmount } oppure { error } */
async function resolveOrderItems(items, restaurantId) {
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

/* crea l'ordine gestendo l'estremamente rara collisione di orderCode: se
   Order.create fallisce per un duplicate key sul campo orderCode, genera un
   nuovo codice e ritenta invece di lasciar risalire un errore mongo 500 non
   gestito esplicitamente. qualsiasi altro errore (es. di validazione) viene
   rilanciato subito, senza ritentare */
async function createOrderWithUniqueCode(orderData) {
  for (let attempt = 1; attempt <= MAX_ORDER_CODE_ATTEMPTS; attempt++) {
    try {
      return await Order.create({ ...orderData, orderCode: generateOrderCode() });
    } catch (err) {
      const isOrderCodeCollision = err.code === 11000 && Object.hasOwn(err.keyPattern || {}, 'orderCode');
      if (!isOrderCodeCollision || attempt === MAX_ORDER_CODE_ATTEMPTS) {
        throw err;
      }
    }
  }
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

module.exports = {
  belongsToRestaurantMenu,
  findDishesById,
  findInvalidDishError,
  sumOrderItems,
  resolveOrderItems,
  createOrderWithUniqueCode,
  populateOrderDetails
};
