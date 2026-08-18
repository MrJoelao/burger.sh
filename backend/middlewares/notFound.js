// viene eseguito quando nessuna route ha gestito la richiesta, non gestisce l'errore ma lo passa a errorHandler
const createError = require('http-errors');

function notFound(req, res, next) {
  next(createError(404, `Risorsa non trovata: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
