require('dotenv').config();

var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var rateLimit = require('express-rate-limit');

var notFound = require('./middlewares/notFound');
var errorHandler = require('./middlewares/errorHandler');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

/**
 * PROTEZIONE GLOBALE: Rate limiting per richieste pubbliche (non autenticate)
 * 
 * Limite: 100 richieste per IP ogni 15 minuti
 * Motivo: Protezione base contro DoS da parte di clienti non autenticati
 * Applicato a: Tutti gli endpoint pubblici (login, registrazione, liste pubbliche)
 * 
 * Utenti autenticati hanno limiti più alti definiti in authMiddleware.js
 */
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,     // 15 minuti
  max: 100,                     // 100 richieste per IP
  keyGenerator: (req) => {
    // Limita per IP (gli utenti non autenticati non hanno ID)
    return req.ip;
  },
  skip: (req) => {
    // Salta il rate limit per utenti autenticati
    // (loro hanno limiti diversi in authMiddleware)
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

// middleware che gestisce le richieste che non corrispondenti a nessuna delle route definite.
// deve essere registrata dopo tutte le route, altrimenti intercetterebbe ogni richiesta prima che possa
// raggiungere il controller corretto.
app.use(notFound);

// middleware globale per la gestione degli errori. deve essere l'ultimo middleware perché deve poter ricevere
// gli errori generati dalle route e dai middleware precedenti.
app.use(errorHandler);

module.exports = app;
