const cartService = require('../services/cartService');
const { jsonOk, jsonError, jsonMessage } = require('../utils/httpResponses');

/* controller del carrello: legge la richiesta, delega la logica di dominio a
   cartService e traduce il risultato in una risposta http. stesso pattern
   di orderController, ma per la risorsa /api/cart, che rappresenta il
   carrello in bozza del cliente autenticato (data-model.md §5). */

// aggiunge un piatto al carrello, creandolo se non esiste ancora
async function addItem(req, res, next) {
  try {
    const { restaurantId, dishId, quantity } = req.validated;

    const result = await cartService.addItem(req.user.id, { restaurantId, dishId, quantity });
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

// get carrello del cliente autenticato
async function getCart(req, res, next) {
  try {
    const result = await cartService.getCart(req.user.id);
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

// aggiorna la quantity di un piatto già presente nel carrello
async function updateItem(req, res, next) {
  try {
    const { dishId } = req.params;
    const { quantity } = req.validated;

    const result = await cartService.updateItemQuantity(req.user.id, dishId, quantity);
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

// rimuove un piatto dal carrello
async function removeItem(req, res, next) {
  try {
    const { dishId } = req.params;

    const result = await cartService.removeItem(req.user.id, dishId);
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

// elimina il carrello del cliente
async function discardCart(req, res, next) {
  try {
    const result = await cartService.discardCart(req.user.id);
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonMessage(res, 200, 'Draft order discarded');
  } catch (err) {
    next(err);
  }
}

// conferma il carrello: da qui diventa un ordine vero e proprio, in stato "ordered"
async function confirmCart(req, res, next) {
  try {
    const { mode, delivery } = req.validated;

    const result = await cartService.confirmCart(req.user.id, { mode, delivery });
    if (result.error) {
      return jsonError(res, result.statusCode, result.error);
    }

    return jsonOk(res, 200, result.order);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  addItem,
  getCart,
  updateItem,
  removeItem,
  discardCart,
  confirmCart
};
