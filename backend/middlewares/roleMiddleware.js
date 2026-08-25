const { unauthorized } = require('../utils/authorization');
const { handleAuth } = require('../utils/httpResponses');

/* middleware generico per riservare una rotta a uno o più ruoli, così i
   controller non devono ripetere lo stesso controllo "if (!isAdmin(...))"
   in ogni singola funzione. va usato dopo authMiddleware, che popola req.user. */
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return handleAuth(res, unauthorized('Only admins can perform this operation'));
    }

    return next();
  };
}

const requireAdmin = requireRole('admin');

module.exports = { requireRole, requireAdmin };
