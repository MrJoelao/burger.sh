const User = require('../models/User');
const { isManager, unauthorized } = require('../utils/authorization');
const { handleAuth } = require('../utils/httpResponses');

/* middleware generico per riservare una rotta a uno o più ruoli, così i
   controller non devono ripetere lo stesso controllo "if (!isAdmin(...))"
   in ogni singola funzione. va usato dopo authMiddleware, che popola req.user. */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return handleAuth(res, unauthorized(`Only ${roles.join(' or ')} can perform this operation`));
    }

    return next();
  };
}

const requireAdmin = requireRole('admin');

/* blocca un manager con managerStatus "pending": può autenticarsi ma non
   gestire filiale, menu e ordini finché un admin non lo approva
   (architecture-and-flows.md §7). non tocca admin e customer, che restano
   soggetti solo ai controlli di autorizzazione già esistenti sulla rotta.
   il token jwt contiene solo id e role (vedi utils/jwt.js), quindi lo stato
   va letto dal db a ogni richiesta: così un manager approvato da poco non
   resta bloccato fino alla scadenza del token, e uno sospeso viene fermato subito. */
async function requireApprovedManager(req, res, next) {
  if (!isManager(req.user)) {
    return next();
  }

  try {
    const manager = await User.findById(req.user.id).select('managerStatus');

    if (!manager || manager.managerStatus !== 'approved') {
      return handleAuth(res, unauthorized('Manager account is pending approval'));
    }

    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { requireRole, requireAdmin, requireApprovedManager };
