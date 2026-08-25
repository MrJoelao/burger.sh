const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const { applyPasswordUpdate } = require('../utils/password');
const { jsonOk, jsonError, jsonMessage, jsonPaginated } = require('../utils/httpResponses');
const { countsByKey } = require('../utils/aggregation');
const { reassignOrCloseManagerRestaurants } = require('./userController');

/* valori ammessi per i filtri di getAllUsers: qualsiasi altro valore (comprese
   stringhe fuori da questo elenco o oggetti come { $ne: null }, che qs può
   costruire da una query string del tipo "role[$ne]=null") viene ignorato,
   per evitare di far arrivare a mongoose un operatore non previsto (NoSQL injection) */
const ALLOWED_ROLE_FILTERS = ['customer', 'manager', 'admin'];
const ALLOWED_MANAGER_STATUS_FILTERS = ['pending', 'approved'];

// costruisce il filtro di getAllUsers accettando solo valori tra quelli ammessi
function buildUserFilter(query) {
  const filter = {};

  if (ALLOWED_ROLE_FILTERS.includes(query.role)) {
    filter.role = query.role;
  }
  if (ALLOWED_MANAGER_STATUS_FILTERS.includes(query.managerStatus)) {
    filter.managerStatus = query.managerStatus;
  }

  return filter;
}

/* controller di amministrazione: gestione degli utenti della piattaforma
   (lista, dettaglio, modifica, eliminazione), approvazione dei manager
   pending e statistiche aggregate. tutte le operazioni sono riservate
   all'admin (controllo fatto dal middleware requireAdmin sulla rotta). */

// get tutti gli utenti (con paginazione e filtri opzionali per ruolo/stato manager)
async function getAllUsers(req, res, next) {
  try {
    const { page, limit, skip } = req.pagination;
    const filter = buildUserFilter(req.query);

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

/* un rifiuto declassa sempre l'utente a customer, così non resta bloccato in
   uno stato manager "rifiutato" (architecture-and-flows.md §8.6: l'admin
   "approva o rifiuta" un account manager) */
function applyManagerRejection(updates) {
  if (updates.managerStatus !== 'rejected') {
    return updates;
  }

  const { managerStatus, ...rest } = updates;
  return { ...rest, role: 'customer' };
}

/* managerStatus ha senso solo per un utente che è (o resta) un manager: senza
   questo controllo un admin potrebbe impostarlo su un customer o su un admin */
function isManagerStatusConsistent(updates, currentRole) {
  if (!Object.hasOwn(updates, 'managerStatus')) {
    return true;
  }

  const resultingRole = updates.role || currentRole;
  return resultingRole === 'manager';
}

/* quando l'update fa uscire l'utente dal ruolo manager, managerStatus non ha
   più senso e va rimosso esplicitamente: un $set con un valore undefined
   verrebbe semplicemente ignorato da mongo, lasciando lo stato precedente */
function buildUserUpdate(updates, isLeavingManagerRole) {
  const mongoUpdate = { $set: updates };
  if (isLeavingManagerRole) {
    mongoUpdate.$unset = { managerStatus: '' };
  }
  return mongoUpdate;
}

/* update utente: usata sia per modificare i dati di un utente, sia per
   approvare o rifiutare un manager pending (managerStatus "approved"/"rejected").
   se l'update declassa un manager proprietario di una filiale, la filiale
   viene trasferita o chiusa con la stessa regola già usata da deleteUser,
   così Restaurant.managerId non resta mai orfano */
async function updateUser(req, res, next) {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return jsonError(res, 404, 'User not found');
    }

    const { newManagerId, ...rawUpdates } = req.validated;

    if (!isManagerStatusConsistent(rawUpdates, targetUser.role)) {
      return jsonError(res, 400, 'managerStatus can only be set on a manager');
    }

    const updates = await applyPasswordUpdate(applyManagerRejection(rawUpdates));
    const isLeavingManagerRole = targetUser.role === 'manager' && updates.role && updates.role !== 'manager';

    if (isLeavingManagerRole) {
      await reassignOrCloseManagerRestaurants(targetUser._id, newManagerId);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      buildUserUpdate(updates, isLeavingManagerRole),
      { returnDocument: 'after', runValidators: true }
    ).select('-passwordHash');

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
    /* i carrelli in bozza (status "draft") non sono ordini effettivi: vanno
       esclusi come già avviene in tutte le query di orderService, altrimenti
       il totale e il breakdown per stato risultano gonfiati */
    const confirmedOrdersFilter = { status: { $ne: 'draft' } };

    const [usersByRole, restaurantsTotal, ordersByStatus, ordersTotal] = await Promise.all([
      User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
      Restaurant.countDocuments(),
      Order.aggregate([{ $match: confirmedOrdersFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.countDocuments(confirmedOrdersFilter)
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
