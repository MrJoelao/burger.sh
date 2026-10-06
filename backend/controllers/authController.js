const authService = require('../services/authService');
const { jsonOk, jsonError } = require('../utils/httpResponses');

/* controller di autenticazione: gestisce registrazione e login.
   i dati in req.validated sono già passati dal middleware di validazione,
   quindi qui non serve ricontrollare formato o campi obbligatori. la
   logica di dominio vive in authService, come già avviene per gli ordini
   con orderService. */

// register: crea un nuovo utente (customer o manager) e restituisce subito un token
async function register(req, res, next) {
  try {
    const { name, surname, email, password, role } = req.validated;

    const { error, statusCode, result } = await authService.register({ name, surname, email, password, role });
    if (error) {
      return jsonError(res, statusCode, error);
    }

    return jsonOk(res, 201, result);
  } catch (err) {
    next(err);
  }
}

// login: verifica le credenziali e restituisce un token se sono corrette
async function login(req, res, next) {
  try {
    const { email, password } = req.validated;

    const { error, statusCode, result } = await authService.login({ email, password });
    if (error) {
      return jsonError(res, statusCode, error);
    }

    return jsonOk(res, 200, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};
