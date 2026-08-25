const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const { applyPasswordUpdate } = require('../utils/password');
const { jsonOk, jsonError, jsonMessage, jsonPaginated } = require('../utils/httpResponses');
const { countsByKey } = require('../utils/aggregation');
const { reassignOrCloseManagerRestaurants } = require('./userController');

/* controller di amministrazione: gestione degli utenti della piattaforma
   (lista, dettaglio, modifica, eliminazione), approvazione dei manager
   pending e statistiche aggregate. tutte le operazioni sono riservate
   all'admin (controllo fatto dal middleware requireAdmin sulla rotta). */

// get tutti gli utenti (con paginazione e filtri opzionali per ruolo/stato manager)
async function getAllUsers(req, res, next) {
  try {
    const { page, limit, skip } = req.pagination;
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.managerStatus) {
      filter.managerStatus = req.query.managerStatus;
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).select('-passwordHash').skip(skip).limit(limit)
    ]);

    return jsonPaginated(res, 200, page, limit, total, users);
  } catch (err) {
    next(err);
  }
}

// get utente by id
async function getUserById(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash');
    if (!user) {
      return jsonError(res, 404, 'User not found');
    }

    return jsonOk(res, 200, user);
  } catch (err) {
    next(err);
  }
}

/* update utente: usata sia per modificare i dati di un utente, sia per
   approvare un manager pending impostando managerStatus a "approved" */
async function updateUser(req, res, next) {
  try {
    const updates = await applyPasswordUpdate(req.validated);

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true
    }).select('-passwordHash');

    if (!updatedUser) {
      return jsonError(res, 404, 'User not found');
    }

    return jsonOk(res, 200, updatedUser);
  } catch (err) {
    next(err);
  }
}

// delete utente: se è un manager proprietario, chiude o trasferisce la sua filiale
async function deleteUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return jsonError(res, 404, 'User not found');
    }

    if (user.role === 'manager') {
      const { newManagerId } = req.validated;
      await reassignOrCloseManagerRestaurants(user._id, newManagerId);
    }

    await User.findByIdAndDelete(user._id);

    return jsonMessage(res, 200, 'User deleted successfully');
  } catch (err) {
    next(err);
  }
}

// get statistiche aggregate della piattaforma (utenti, filiali, ordini)
async function getStats(req, res, next) {
  try {
    const [usersByRole, restaurantsTotal, ordersByStatus, ordersTotal] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Restaurant.countDocuments(),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.countDocuments()
    ]);

    return jsonOk(res, 200, {
      users: {
        total: usersByRole.reduce((sum, { count }) => sum + count, 0),
        byRole: countsByKey(usersByRole)
      },
      restaurants: {
        total: restaurantsTotal
      },
      orders: {
        total: ordersTotal,
        byStatus: countsByKey(ordersByStatus)
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStats
};
