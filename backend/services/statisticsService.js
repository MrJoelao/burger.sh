const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const { countsByKey } = require('../utils/aggregation');

/* statistiche aggregate della piattaforma (utenti, filiali, ordini), usate
   dalla dashboard di amministrazione. il controller si limita a chiamare
   questa funzione e a tradurne il risultato in risposta http, sullo stesso
   modello già seguito da orderController/orderService. */

// get statistiche aggregate della piattaforma (utenti, filiali, ordini)
async function getPlatformStats() {
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

  return {
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
  };
}

module.exports = { getPlatformStats };
