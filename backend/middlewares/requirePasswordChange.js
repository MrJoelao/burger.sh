const { jsonError } = require('../utils/httpResponses');

/**
 * Middleware che verifica se l'utente deve cambiare password.
 * Se mustChangePassword e' true, blocca tutte le richieste tranne:
 * - POST /api/setup/change-password (per cambiare la password)
 * - GET /api/setup/status (per verificare lo stato del setup)
 */
function requirePasswordChange(req, res, next) {
  // Skip per l'endpoint di cambio password
  if (req.path === '/setup/change-password') {
    return next();
  }
  
  // Skip per le rotte di setup pubbliche
  if (req.path.startsWith('/setup')) {
    return next();
  }
  
  const user = req.user;
  if (user && user.mustChangePassword) {
    return jsonError(res, 403, 'Password change required. Please change your password before accessing this resource.');
  }
  
  next();
}

module.exports = requirePasswordChange;
