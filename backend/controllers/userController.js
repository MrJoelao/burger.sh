const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const Ingredient = require('../models/Ingredient');
const { applyPasswordUpdate } = require('../utils/password');
const { jsonOk, jsonMessage, badRequest } = require('../utils/httpResponses');
const { findOrThrow } = require('../utils/authorization');

/* controller del profilo utente: ogni utente autenticato (customer, manager
   o admin) può consultare, modificare ed eliminare i propri dati tramite
   req.user.id, senza bisogno di passare l'id nel path. */

// verifica che newManagerId appartenga a un manager esistente e approvato
async function assertApprovedManager(newManagerId) {
  const newManager = await User.findById(newManagerId);
  if (!newManager || newManager.role !== 'manager' || newManager.managerStatus !== 'approved') {
    throw badRequest('newManagerId must belong to an approved manager');
  }
}

/* User.restaurantId è solo una denormalizzazione della relazione espressa da
   Restaurant.managerId, tenuta per evitare una query in più in GET /users/me.
   va quindi ricalcolata dalla fonte di verità dopo ogni cambio di proprietà:
   un puntatore stantio darebbe al manager uscente accesso alla filiale ceduta
   e lascerebbe quello entrante senza filiale. */
async function syncManagerRestaurant(managerId) {
  const ownedRestaurant = await Restaurant.findOne({ managerId }).select('_id').sort({ _id: 1 });

  await User.findByIdAndUpdate(managerId, {
    restaurantId: ownedRestaurant ? ownedRestaurant._id : null
  });
}

/* riallinea più manager in una volta, senza ripetere la query per gli id
   duplicati che il trasferimento di più filiali allo stesso manager produce */
async function syncManagerRestaurants(managerIds) {
  const uniqueIds = [...new Set(managerIds.map(String))];

  await Promise.all(uniqueIds.map(syncManagerRestaurant));
}

// riassegna le filiali indicate a un nuovo manager approvato
async function transferRestaurants(restaurants, newManagerId) {
  await assertApprovedManager(newManagerId);

  const restaurantIds = restaurants.map(restaurant => restaurant._id);
  const previousManagerIds = restaurants.map(restaurant => restaurant.managerId);

  await Restaurant.updateMany({ _id: { $in: restaurantIds } }, { managerId: newManagerId });

  await syncManagerRestaurants([...previousManagerIds, newManagerId]);
}

// chiude le filiali indicate, eliminandole insieme ai loro piatti custom
async function closeRestaurants(restaurants) {
  const restaurantIds = restaurants.map(restaurant => restaurant._id);
  const previousManagerIds = restaurants.map(restaurant => restaurant.managerId);

  await Dish.deleteMany({ restaurantId: { $in: restaurantIds } });
  await Ingredient.deleteMany({ restaurantId: { $in: restaurantIds } });
  await Restaurant.deleteMany({ _id: { $in: restaurantIds } });

  await syncManagerRestaurants(previousManagerIds);
}

/* trasferisce le filiali indicate a un altro manager approvato, oppure le
   chiude se non viene indicato un successore. condivisa tra la chiusura
   dell'account di un manager (tutte le sue filiali) e la chiusura di una
   singola filiale da parte del manager proprietario, così le due operazioni
   seguono sempre la stessa regola. */
async function settleRestaurants(restaurants, newManagerId) {
  if (restaurants.length === 0) {
    return;
  }

  if (newManagerId) {
    return transferRestaurants(restaurants, newManagerId);
  }

  return closeRestaurants(restaurants);
}

/* trasferisce o chiude tutte le filiali di un manager, usata quando il manager
   stesso esce dal ruolo (eliminazione dell'account o declassamento da parte
   dell'admin). condivisa con adminController. */
async function resolveManagerRestaurants(managerId, newManagerId) {
  const restaurants = await Restaurant.find({ managerId });
  await settleRestaurants(restaurants, newManagerId);
}

// get i propri dati
async function getMe(req, res, next) {
  try {
    const user = await findOrThrow(User.findById(req.user.id).select('-passwordHash'), 'User not found');

    // includi restaurantId se presente
    const userData = user.toObject();
    if (userData.restaurantId) {
      // popola il ristorante per avere i dettagli completi
      const restaurant = await Restaurant.findById(userData.restaurantId);
      if (restaurant) {
        userData.restaurant = restaurant;
      } else {
        // evita che un riferimento obsoleto lasci il manager fuori dal wizard
        userData.restaurantId = null;
      }
    }

    return jsonOk(res, 200, userData);
  } catch (err) {
    next(err);
  }
}

// update i propri dati
async function updateMe(req, res, next) {
  try {
    const updates = await applyPasswordUpdate(req.validated);

    const updatedUser = await findOrThrow(
      User.findByIdAndUpdate(req.user.id, updates, {
        returnDocument: 'after',
        runValidators: true
      }).select('-passwordHash'),
      'User not found'
    );

    return jsonOk(res, 200, updatedUser);
  } catch (err) {
    next(err);
  }
}

// delete il proprio account
async function deleteMe(req, res, next) {
  try {
    const user = await findOrThrow(User.findById(req.user.id), 'User not found');

    if (user.role === 'manager') {
      const { newManagerId } = req.validated;
      await resolveManagerRestaurants(user._id, newManagerId);
      await Ingredient.deleteMany({ managerId: user._id, restaurantId: null });
    }

    await User.findByIdAndDelete(user._id);

    return jsonMessage(res, 200, 'Account deleted successfully');
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  deleteMe,
  resolveManagerRestaurants,
  settleRestaurants,
  syncManagerRestaurant
};
