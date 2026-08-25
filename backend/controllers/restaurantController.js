const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { isAdmin, isOwner, unauthorized } = require('../utils/authorization');
const { jsonOk, jsonError, paginate, handleAuth } = require('../utils/httpResponses');

/* controller dei ristoranti: consultazione pubblica (lista e dettaglio) e
   gestione riservata a admin (creazione/eliminazione) e al manager
   proprietario (modifica dei propri dati). */

/* chi può modificare un ristorante: admin (globale) oppure il manager
   proprietario di quel ristorante specifico */
function canModifyRestaurant(req, restaurant) {
  if (isAdmin(req.user) || isOwner(restaurant.managerId, req.user.id)) {
    return { authorized: true };
  }

  return unauthorized('Not authorized to modify this restaurant');
}

// get tutti i ristoranti (con paginazione offset-based)
async function getAllRestaurants(req, res, next) {
  try {
    // estrae paginazione dal middleware (già validata e calcolata)
    const { page, limit, skip } = req.pagination;

    const total = await Restaurant.countDocuments();
    const restaurants = await Restaurant.find()
      .skip(skip)
      .limit(limit)
      .populate('managerId', 'name surname email');

    return res.status(200).json({
      success: true,
      ...paginate(page, limit, total, restaurants)
    });
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
    const updates = req.validated;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return jsonError(res, 404, 'Restaurant not found');
    }

    const authCheck = canModifyRestaurant(req, restaurant);
    if (!authCheck.authorized) {
      return handleAuth(res, authCheck);
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    }).populate('managerId', 'name surname email');

    return jsonOk(res, 200, updatedRestaurant);
  } catch (err) {
    next(err);
  }
}

// delete ristorante (solo admin)
async function deleteRestaurant(req, res, next) {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByIdAndDelete(id);
    if (!restaurant) {
      return jsonError(res, 404, 'Restaurant not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
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
