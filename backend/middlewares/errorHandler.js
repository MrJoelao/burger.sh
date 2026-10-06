/* middleware per la gestione degli errori. stesso formato RFC 7807 (Problem Details)
   usato da jsonError in utils/httpResponses.js: prima di questa correzione, un
   errore lanciato (es. da findOrThrow) e passato a next(err) arrivava qui con
   una forma diversa ({ error: { status, message } }) da quella di ogni altro
   errore dell'api, che passa invece da jsonError.

   per statusCode >= 500 il messaggio non arriva mai al client: un CastError
   di Mongoose, un errore di connessione al database o un bug non gestito
   possono contenere dettagli interni (query, stack, indirizzi), che vanno
   solo loggati lato server. sotto i 500 il messaggio resta quello originale,
   perché sono errori applicativi intenzionali (httpError/notFound/badRequest
   di utils/httpResponses.js) pensati per essere letti dall'utente. */
function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(err);
    return res.status(statusCode).json({
      type: 'https://httpstatuses.org/500',
      title: 'Internal Server Error',
      status: 500,
      detail: 'Internal Server Error'
    });
  }

  const problem = {
    type: `https://httpstatuses.org/${statusCode}`,
    title: err.message || 'Error',
    status: statusCode,
    detail: err.message || 'Error'
  };
  
  res.status(statusCode).json(problem);
}

module.exports = errorHandler;
