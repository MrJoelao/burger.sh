const { jsonError } = require('../utils/httpResponses');

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100; // limite massimo per proteggere l'endpoint da richieste eccessive (DoS)

/* controlla che page e limit rispettino i vincoli ammessi, restituendo
   il messaggio d'errore da mostrare al client oppure null se sono validi */
function validatePaginationParams(page, limit) {
  if (page < 1) {
    return 'Page must be >= 1';
  }

  if (limit < 1 || limit > MAX_LIMIT) {
    return `Limit must be between 1 and ${MAX_LIMIT}`;
  }

  return null;
}

/**
 * middleware per estrarre e validare i parametri di paginazione dalla query string.
 * salva page, limit e skip in req.pagination, pronti per essere usati dai controller
 * nelle query offset-based.
 *
 * utilizzo:
 *   router.get('/items', paginationMiddleware, getItemsController);
 *
 * nel controller, accedi a:
 *   const { page, limit, skip } = req.pagination;
 */
function paginationMiddleware(req, res, next) {
  // niente "|| DEFAULT": con l'or, page=0 o limit=0 verrebbero silenziosamente
  // sostituiti dal default invece di far scattare l'errore di validazione
  const parsedPage = parseInt(req.query.page);
  const parsedLimit = parseInt(req.query.limit);
  const page = Number.isNaN(parsedPage) ? DEFAULT_PAGE : parsedPage;
  const limit = Number.isNaN(parsedLimit) ? DEFAULT_LIMIT : parsedLimit;

  const validationError = validatePaginationParams(page, limit);
  if (validationError) {
    return jsonError(res, 400, validationError);
  }

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };

  next();
}

module.exports = paginationMiddleware;
