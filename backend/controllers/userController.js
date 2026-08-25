const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const { applyPasswordUpdate } = require('../utils/password');
const { jsonOk, jsonError, badRequest } = require('../utils/httpResponses');

/* controller del profilo utente: ogni utente autenticato (customer, manager
   o admin) può consultare, modificare ed eliminare i propri dati tramite
   req.user.id, senza bisogno di passare l'id nel path. */

/* trasferisce le filiali di un manager a un altro manager approvato,
   oppure le chiude (eliminandole insieme ai loro piatti custom) se non
   viene indicato un successore. condivisa con adminController, così
   l'eliminazione di un manager segue sempre la stessa regola sia che la
   richieda l'utente stesso sia che la richieda un admin. */
async function reassignOrCloseManagerRestaurants(managerId, newManagerId) {
  const restaurants = await Restaurant.find({ managerId });
  if (restaurants.length === 0) {
    return;
  }

  if (newManagerId) {
    const newManager = await User.findById(newManagerId);
    if (!newManager || newManager.role !== 'manager' || newManager.managerStatus !== 'approved') {
      throw badRequest('newManagerId must belong to an approved manager');
    }

    await Restaurant.updateMany({ managerId }, { managerId: newManagerId });
    return;
  }

  const restaurantIds = restaurants.map(restaurant => restaurant._id);
  await Dish.deleteMany({ restaurantId: { $in: restaurantIds } });
  await Restaurant.deleteMany({ managerId });
}

// get i propri dati
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return jsonError(res, 404, 'User not found');
    }

    return jsonOk(res, 200, user);
  } catch (err) {
    next(err);
  }
}

// update i propri dati
async function updateMe(req, res, next) {
  try {
    const updates = await applyPasswordUpdate(req.validated);

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updates, {
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

// delete il proprio account
async function deleteMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return jsonError(res, 404, 'User not found');
    }

    if (user.role === 'manager') {
      const { newManagerId } = req.validated;
      await reassignOrCloseManagerRestaurants(user._id, newManagerId);
    }

    await User.findByIdAndDelete(user._id);

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  deleteMe,
  reassignOrCloseManagerRestaurants
};
