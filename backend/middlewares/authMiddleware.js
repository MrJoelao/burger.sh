const { verifyToken } = require('../utils/jwt');
const { jsonError } = require('../utils/httpResponses');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const ROLE_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto

/* crea un rate limiter dedicato a un ruolo: si applica solo alle richieste
   di quel ruolo (skip per tutte le altre), evitando di ripetere la stessa
   configurazione tre volte per admin/manager/customer */
function createRoleRateLimiter(role, max) {
  return rateLimit({
    windowMs: ROLE_RATE_LIMIT_WINDOW_MS,
    max,
    keyGenerator: (req) => req.user?.id || role,
    skip: (req) => req.user?.role !== role,
    message: `${role} rate limit exceeded`
  });
}

// admin: 10k req/min (controllo globale, accesso critico)
const adminRateLimiter = createRoleRateLimiter('admin', 10000);
// manager: 1k req/min (gestione ristorante, operazioni moderate)
const managerRateLimiter = createRoleRateLimiter('manager', 1000);
// customer: 500 req/min (operazioni semplici, protezione anti-DoS)
const customerRateLimiter = createRoleRateLimiter('customer', 500);

/* rate limiter applicato quando l'header Authorization è presente ma il
   token non è valido. senza questo, un client può inviare un qualsiasi
   header "Bearer <valore inventato>" per far saltare il publicLimiter di
   app.js (che salta ogni richiesta con prefisso "Bearer ") e finire comunque
   qui senza mai incontrare i rate limiter per ruolo sopra, che si eseguono
   solo dopo una verifica del token riuscita: il risultato era un bypass
   completo di ogni limite di richieste. */
const invalidTokenRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minuti, stessa finestra del publicLimiter
  max: 100,
  // ipKeyGenerator normalizza correttamente anche gli indirizzi IPv6
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  message: 'Too many requests from this IP, please try again later.'
});

/**
 * middleware di autenticazione + rate limiting per utenti autenticati
 * 
 * flusso:
 * 1. verifica che il token JWT sia valido
 * 2. estrae dati utente dal token
 * 3. applica rate limiter basato sul ruolo dell'utente
 * 4. passa al prossimo middleware
 * 
 * rate limit per ruolo:
 *   - admin: 10k req/min (controllo globale, accesso critico)
 *   - manager: 1k req/min (gestione ristorante, operazioni moderate)
 *   - customer: 500 req/min (operazioni semplici, protezione anti-DoS)
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonError(res, 401, 'Missing token or invalid format');
  }

  const token = authHeader.slice(7);

  try {
    const decoded = verifyToken(token);
    
    // Check if token is invalidated
    const tokenInvalidator = require('../utils/token/invalidator');
    if (tokenInvalidator.isTokenInvalidated(token)) {
      throw new Error('Token invalidated');
    }
    
    req.user = decoded;

    /* nuovo: applica rate limiting basato sul ruolo.
       ogni ruolo ha un limiter dedicato che controlla se deve essere applicato.
       il limiter per il ruolo dell'utente lo processerà, gli altri lo skipperanno */
    adminRateLimiter(req, res, () => {
      managerRateLimiter(req, res, () => {
        customerRateLimiter(req, res, next);
      });
    });
  } catch (error) {
    return invalidTokenRateLimiter(req, res, () => jsonError(res, 401, 'Invalid or expired token'));
  }
}

module.exports = authMiddleware;
