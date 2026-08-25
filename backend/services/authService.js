const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/password');
const { signUser } = require('../utils/jwt');

/* logica di dominio dell'autenticazione: registrazione e login. il
   controller resta responsabile solo di leggere la richiesta, chiamare
   queste funzioni e tradurne il risultato in una risposta http, esattamente
   come fa orderController con orderService. */

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

// registra un nuovo utente (customer o manager) e restituisce subito un token
async function register({ name, surname, email, password, role }) {
  /* lo schema email ha lowercase:true, quindi il confronto va normalizzato
     allo stesso modo, altrimenti due casing diversi della stessa email
     sfuggirebbero al controllo di duplicato e farebbero fallire la create()
     con un E11000 non gestito */
  const normalizedEmail = email.toLowerCase().trim();

  // controllo che l'email non sia già usata
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return { error: 'Email already in use', statusCode: 409 };
  }

  const passwordHash = await hashPassword(password);

  const userData = {
    name,
    surname,
    email: normalizedEmail,
    passwordHash,
    role // customer o manager
  };

  // solo i manager hanno managerStatus
  if (role === 'manager') {
    userData.managerStatus = 'pending';
  }

  const user = await User.create(userData);

  return { result: buildAuthResponse(user) };
}

// verifica le credenziali e restituisce un token se sono corrette
async function login({ email, password }) {
  /* stesso motivo del register: l'email è salvata in lowercase, quindi va
     normalizzata prima della query o un login con casing diverso da quello
     usato in fase di registrazione fallirebbe anche con password corretta */
  const normalizedEmail = email.toLowerCase().trim();

  /* cerco l'utente tramite email. il messaggio d'errore resta identico sia che
     l'email non esista sia che la password sia sbagliata, altrimenti si
     potrebbe scoprire quali email sono registrate provando il login (user enumeration) */
  const user = await User.findOne({ email: normalizedEmail });
  const isMatch = user && await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    return { error: 'Invalid credentials', statusCode: 401 };
  }

  return { result: buildAuthResponse(user) };
}

module.exports = {
  register,
  login
};
