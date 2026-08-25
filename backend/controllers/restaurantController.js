const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const Dish = require('../models/Dish');
const { isAdmin, isOwner, unauthorized, findOrThrow } = require('../utils/authorization');
const { jsonOk, jsonError, jsonMessage, jsonPaginated, handleAuth } = require('../utils/httpResponses');
const { containsFilter, combineFilters } = require('../utils/searchFilters');
const { closeOrTransferRestaurants } = require('./userController');

/* controller dei ristoranti: consultazione pubblica (lista e dettaglio) e
   gestione riservata a admin (creazione/eliminazione) e al manager
   proprietario (modifica dei propri dati). */

/* risolve il filtro sul ristorante a partire dal nome di un piatto offerto:
   un piatto del menu comune (isCustom: false) è ordinabile in qualsiasi
   filiale, quindi non restringe la ricerca; un piatto custom la restringe
   invece ai soli ristoranti proprietari di quel piatto */
async function restaurantIdsOfferingDish(dishName) {
  const matchingDishes = await Dish.find(
    { name: containsFilter(dishName) },
    'isCustom restaurantId'
  );

  const offersCommonDish = matchingDishes.some((dish) => !dish.isCustom);
  if (offersCommonDish) {
    return null;
  }

  return matchingDishes.filter((dish) => dish.isCustom).map((dish) => dish.restaurantId);
}

/* costruisce il filtro Mongoose per GET /api/restaurants a partire dai
   parametri di ricerca opzionali name, city e dishName */
async function buildRestaurantSearchFilter({ name, city, dishName }) {
  const conditions = [];

  const nameFilter = containsFilter(name);
  if (nameFilter) {
    conditions.push({ name: nameFilter });
  }

  const cityFilter = containsFilter(city);
  if (cityFilter) {
    conditions.push({ city: cityFilter });
  }

  if (dishName) {
    const restaurantIds = await restaurantIdsOfferingDish(dishName);
    if (restaurantIds) {
      conditions.push({ _id: { $in: restaurantIds } });
    }
  }

  return combineFilters(conditions);
}

/* chi può modificare un ristorante: admin (globale) oppure il manager
   proprietario di quel ristorante specifico */
function canModifyRestaurant(req, restaurant) {
  if (isAdmin(req.user) || isOwner(restaurant.managerId, req.user.id)) {
    return { authorized: true };
  }

  return unauthorized('Not authorized to modify this restaurant');
}

// get tutti i ristoranti (con paginazione offset-based e filtri di ricerca opzionali)
async function getAllRestaurants(req, res, next) {
  try {
    // estrae paginazione dal middleware (già validata e calcolata)
    const { page, limit, skip } = req.pagination;
    const { name, city, dishName } = req.query;

    const filter = await buildRestaurantSearchFilter({ name, city, dishName });

    const total = await Restaurant.countDocuments(filter);
    const restaurants = await Restaurant.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('managerId', 'name surname email');

    return jsonPaginated(res, 200, page, limit, total, restaurants);
  } catch (err) {
    next(err);
  }
}

// get ristorante by id
async function getRestaurantById(req, res, next) {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id).populate('managerId', 'name surname email');
    if (!restaurant) {
      return jsonError(res, 404, 'Restaurant not found');
    }

    return jsonOk(res, 200, restaurant);
  } catch (err) {
    next(err);
  }
}

// create ristorante (solo admin)
async function createRestaurant(req, res, next) {
  try {
    const { name, address, city, phone, vatNumber, managerId } = req.validated;

    // verifica che il manager esista e sia un manager
    const manager = await User.findById(managerId);
    if (!manager || manager.role !== 'manager') {
      return jsonError(res, 400, 'Invalid manager ID or user is not a manager');
    }

    const restaurant = await Restaurant.create({
      name,
      address,
      city,
      phone,
      vatNumber,
      managerId
    });

    const populatedRestaurant = await restaurant.populate('managerId', 'name surname email');

    return jsonOk(res, 201, populatedRestaurant);
  } catch (err) {
    next(err);
  }
}

// update ristorante (solo il manager del ristorante o admin)
async function updateRestaurant(req, res, next) {
  try {
    const { id } = req.params;
    const updates = { ...req.validated };

    /* managerId non è modificabile tramite questo endpoint: il trasferimento
       di un ristorante a un altro manager è un'operazione riservata all'admin
       e va fatta con un flusso dedicato, non con una update generica (evita
       che un manager proprietario ceda/rubi la propria filiale a chiunque) */
    delete updates.managerId;

    const restaurant = await findOrThrow(Restaurant.findById(id), 'Restaurant not found');

    const authCheck = canModifyRestaurant(req, restaurant);
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(id, updates, {
      returnDocument: 'after',
      runValidators: true
    }).populate('managerId', 'name surname email');

    return jsonOk(res, 200, updatedRestaurant);
  } catch (err) {
    next(err);
  }
}

/* delete ristorante: l'admin può chiudere qualsiasi filiale, il manager
   proprietario può chiudere la propria senza dover eliminare l'intero
   account (a differenza di prima, quando l'unico modo era DELETE /api/users/me).
   con newManagerId nel body, la filiale viene trasferita invece di essere
   chiusa, riusando la stessa regola già applicata alla dismissione di un manager. */
async function deleteRestaurant(req, res, next) {
  try {
    const { id } = req.params;
    const { newManagerId } = req.validated || {};

    const restaurant = await findOrThrow(Restaurant.findById(id), 'Restaurant not found');

    const authCheck = canModifyRestaurant(req, restaurant);
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    await closeOrTransferRestaurants([restaurant], newManagerId);

    return jsonMessage(res, 200, 'Restaurant deleted successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
};
