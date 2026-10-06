const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const dishService = require('../services/dishService');

const { findOrThrow } = require('../utils/authorization');
const { jsonOk, jsonMessage, jsonPaginated, handleAuth, badRequest } = require('../utils/httpResponses');
const { combineFilters } = require('../utils/searchFilters');

/* controller dei piatti: legge la richiesta, delega la logica di dominio a
   dishService e traduce il risultato in una risposta http, sullo stesso
   modello già seguito da orderController/orderService. */

// get tutti i piatti, con filtri di ricerca opzionali (nome, tipologia, prezzo, ingrediente, allergene)
async function getAllDishes(req, res, next) {
  try {
    const pagination = req.pagination || { page: 1, limit: 10, skip: 0 };

    const filter = combineFilters(await dishService.buildDishSearchConditions(req.query));
    const { total, dishes } = await dishService.listDishes(filter, pagination);

    return jsonPaginated(res, 200, pagination.page, pagination.limit, total, dishes);
  } catch (err) {
    return next(err);
  }
}

/* get piatti per ristorante: restituisce i piatti del menu base (validi
   per tutti i ristoranti) uniti ai piatti custom di quel ristorante,
   con gli stessi filtri di ricerca opzionali di getAllDishes */
async function getDishesByRestaurant(req, res, next) {
  try {
    const { restaurantId } = req.params;
    const pagination = req.pagination || { page: 1, limit: 10, skip: 0 };

    const belongsToRestaurantMenu = {
      $or: [
        { isCustom: false },
        { isCustom: true, restaurantId }
      ]
    };
    const searchConditions = await dishService.buildDishSearchConditions(req.query);
    const filter = combineFilters([belongsToRestaurantMenu, ...searchConditions]);

    const { total, dishes } = await dishService.listDishes(filter, pagination);

    return jsonPaginated(res, 200, pagination.page, pagination.limit, total, dishes);
  } catch (err) {
    return next(err);
  }
}

// get piatto per id
async function getDishById(req, res, next) {
  try {
    const dish = await findOrThrow(Dish.findById(req.params.id).populate('restaurantId'), 'Dish not found');
    const populatedDish = await dishService.populateDish(dish);

    return jsonOk(res, 200, populatedDish);
  } catch (err) {
    return next(err);
  }
}

/* create piatto: un piatto normale finisce nel menu base, un piatto
   custom viene invece legato a un ristorante specifico */
async function createDish(req, res, next) {
  try {
    const {
      name,
      type,
      price,
      photoUrl,
      ingredientIds,
      isCustom = false,
      restaurantId
    } = req.validated;

    let restaurant = null;

    // se il piatto è custom, il ristorante è obbligatorio e deve esistere
    if (isCustom) {
      if (!restaurantId) {
        throw badRequest('restaurantId is required for custom dishes');
      }

      restaurant = await findOrThrow(Restaurant.findById(restaurantId), 'Restaurant not found');
    }

    const authCheck = dishService.canCreateDish(req.user, isCustom, restaurant);

    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    const dish = await Dish.create({
      name,
      type,
      price,
      photoUrl: photoUrl || '',
      ingredientIds: ingredientIds || [],
      isCustom: Boolean(isCustom),
      restaurantId: isCustom ? restaurantId : null
    });

    const populatedDish = await dishService.populateDish(dish);

    return jsonOk(res, 201, populatedDish);
  } catch (err) {
    return next(err);
  }
}

// update piatto
async function updateDish(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.validated };

    const dish = await findOrThrow(Dish.findById(id).populate('restaurantId'), 'Dish not found');

    const authCheck = dishService.canManageDish(req.user, dish);

    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    // isCustom e restaurantId non sono modificabili dopo la creazione
    delete updates.isCustom;
    delete updates.restaurantId;

    const updatedDish = await Dish.findByIdAndUpdate(
      id,
      updates,
      {
        returnDocument: 'after',
        runValidators: true
      }
    );

    const populatedDish = await dishService.populateDish(updatedDish);

    return jsonOk(res, 200, populatedDish);
  } catch (err) {
    return next(err);
  }
}

// delete piatto
async function deleteDish(req, res, next) {
  try {
    const dish = await findOrThrow(Dish.findById(req.params.id).populate('restaurantId'), 'Dish not found');

    const authCheck = dishService.canManageDish(req.user, dish);

    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    await dish.constructor.deleteOne({ _id: dish._id });

    return jsonMessage(res, 200, 'Dish deleted successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getAllDishes,
  getDishesByRestaurant,
  getDishById,
  createDish,
  updateDish,
  deleteDish
};
