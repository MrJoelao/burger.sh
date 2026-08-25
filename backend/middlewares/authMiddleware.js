const { verifyToken } = require('../utils/jwt');
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter per utenti autenticati - ADMIN (permissivo)
 * 10.000 richieste per minuto
 * Motivo: Admin gestisc l'intera piattaforma, ha accesso critico
 */
const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minuto
  max: 10000,                   // 10k richieste
  keyGenerator: (req) => req.user?.id || 'admin',
  skip: (req) => req.user?.role !== 'admin',  // Applica solo ad admin
  message: 'Admin rate limit exceeded'
});

/**
 * Rate limiter per utenti autenticati - MANAGER
 * 1.000 richieste per minuto
 * Motivo: Manager gestisce un ristorante, operazioni moderate
 */
const managerRateLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minuto
  max: 1000,                    // 1k richieste
  keyGenerator: (req) => req.user?.id || 'manager',
  skip: (req) => req.user?.role !== 'manager',  // Applica solo a manager
  message: 'Manager rate limit exceeded'
});

/**
 * Rate limiter per utenti autenticati - CUSTOMER
 * 500 richieste per minuto
 * Motivo: Customer fa semplici operazioni (browse, order), limite medio
 */
const customerRateLimiter = rateLimit({
  windowMs: 60 * 1000,          // 1 minuto
  max: 500,                     // 500 richieste
  keyGenerator: (req) => req.user?.id || 'customer',
  skip: (req) => req.user?.role !== 'customer',  // Applica solo a customer
  message: 'Customer rate limit exceeded'
});

/**
 * Middleware di autenticazione + rate limiting per utenti autenticati
 * 
 * Flusso:
 * 1. Verifica che il token JWT sia valido
 * 2. Estrae dati utente dal token
 * 3. Applica rate limiter basato sul ruolo dell'utente
 * 4. Passa al prossimo middleware
 * 
 * Rate limit per ruolo:
 *   - Admin: 10k req/min (controllo globale, accesso critico)
 *   - Manager: 1k req/min (gestione ristorante, operazioni moderate)
 *   - Customer: 500 req/min (operazioni semplici, protezione anti-DoS)
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Missing token or invalid format'
    });
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyToken(token);
    
    // NUOVO: Applica rate limiting basato sul ruolo
    // Ogni ruolo ha un limiter dedicato che controlla se deve essere applicato
    // Il limiter per il ruolo dell'utente lo processerà, gli altri lo skipperanno
    adminRateLimiter(req, res, () => {
      managerRateLimiter(req, res, () => {
        customerRateLimiter(req, res, next);
      });
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
}

module.exports = authMiddleware;
