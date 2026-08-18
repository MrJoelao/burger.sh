var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var notFound = require('./middlewares/notFound');
var errorHandler = require('./middlewares/errorHandler');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/api/health', function(req, res) {
  res.status(200).json({
    success: true,
    message: 'API funzionante'
  });
});

const authRoutes = require('./routes/authRoutes');

app.use('/api/auth', authRoutes);

// middleware che gestisce le richieste che non corrispondenti a nessuna delle route definite.
// deve essere registrata dopo tutte le route, altrimenti intercetterebbe ogni richiesta prima che possa
// raggiungere il controller corretto.
app.use(notFound);

// middleware globale per la gestione degli errori. deve essere l’ultimo middleware perché deve poter ricevere
// gli errori generati dalle route e dai middleware precedenti.
app.use(errorHandler);

module.exports = app;
