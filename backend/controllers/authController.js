const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { signUser } = require('../utils/jwt');
const { jsonOk, jsonError } = require('../utils/httpResponses');

/* controller di autenticazione: gestisce registrazione e login.
   i dati in req.validated sono già passati dal middleware di validazione,
   quindi qui non serve ricontrollare formato o campi obbligatori. */

// costruisce la risposta { token, user } comune a register e login
function buildAuthResponse(user) {
  return {
    token: signUser(user),
    user: {
      id: user._id.toString(),
      name: user.name,
      surname: user.surname,
      email: user.email,
      role: user.role,
      managerStatus: user.managerStatus ?? null
    }
  };
}

// register: crea un nuovo utente (customer o manager) e restituisce subito un token
async function register(req, res, next) {
  try {
    const { name, surname, email, password, role } = req.validated;

    // controllo che l'email non sia già usata
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return jsonError(res, 409, 'Email already in use');
    }

    const passwordHash = await hashPassword(password);

    const userData = {
      name,
      surname,
      email,
      passwordHash,
      role // customer o manager
    };

    // solo i manager hanno managerStatus
    if (role === 'manager') {
      userData.managerStatus = 'pending';
    }

    const user = await User.create(userData);

    return jsonOk(res, 201, buildAuthResponse(user));
  } catch (err) {
    next(err);
  }
}

// login: verifica le credenziali e restituisce un token se sono corrette
async function login(req, res, next) {
  try {
    const { email, password } = req.validated;

    // cerco l'utente tramite email. il messaggio d'errore resta identico sia che
    // l'email non esista sia che la password sia sbagliata, altrimenti si
    // potrebbe scoprire quali email sono registrate provando il login (user enumeration)
    const user = await User.findOne({ email });
    const isMatch = user && await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return jsonError(res, 401, 'Invalid credentials');
    }

    return jsonOk(res, 200, buildAuthResponse(user));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login
};
