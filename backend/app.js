require('dotenv').config();

var express = require('express');
var helmet = require('helmet');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var rateLimit = require('express-rate-limit');

var notFound = require('./middlewares/notFound');
var errorHandler = require('./middlewares/errorHandler');

var app = express();

/* imposta gli header http di sicurezza di base (X-Content-Type-Options,
   Strict-Transport-Security, niente X-Powered-By, ecc.), mancanti finora */
app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/* limita le richieste pubbliche (non autenticate) a 100 per ip ogni 15 minuti,
   come protezione di base contro abusi da parte di client non autenticati.
   gli utenti autenticati hanno limiti diversi, definiti in authMiddleware.js */
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minuti
  max: 100,                     // 100 richieste per ip
  keyGenerator: (req) => {
    // limita per ip, perché le richieste non autenticate non hanno un id utente
    return req.ip;
  },
  skip: (req) => {
    // salta il rate limit per le richieste autenticate, che hanno limiti propri in authMiddleware
    return req.headers.authorization?.startsWith('Bearer ');
  },
  message: 'Too many requests from this IP, please try again later.'
});

app.use(publicLimiter);

app.get('/api/health', function(req, res) {
  res.status(200).json({
    success: true,
    message: 'API working correctly'
  });
});

const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const dishRoutes = require('./routes/dishRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

/* gestisce le richieste che non corrispondono a nessuna rotta definita. va registrato
   dopo tutte le rotte, altrimenti intercetterebbe ogni richiesta prima che raggiunga
   il controller corretto */
app.use(notFound);

/* middleware globale per la gestione degli errori. deve essere l'ultimo, perché deve
   poter ricevere gli errori generati dalle rotte e dai middleware precedenti */
app.use(errorHandler);

module.exports = app;
