/* middleware per la gestione degli errori. stesso formato { success: false,
   message } usato da jsonError in utils/httpResponses.js: prima di questa
   correzione, un errore lanciato (es. da findOrThrow) e passato a next(err)
   arrivava qui con una forma diversa ({ error: { status, message } }) da
   quella di ogni altro errore dell'api, che passa invece da jsonError. */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
