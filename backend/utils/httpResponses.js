/* funzioni di supporto per costruire risposte http coerenti (successo, errore, paginazione)
   e per generare errori applicativi con uno status code associato. usate da tutti i controller,
   così il formato della risposta json resta identico in tutta l'api. */

// risposta di successo: { success: true, data? }
function jsonOk(res, statusCode, data) {
  return res.status(statusCode).json({
    success: true,
    ...(data !== undefined ? { data } : {})
  });
}

// risposta di errore: { success: false, message }
function jsonError(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message
  });
}

// avvolge i dati con i metadati di paginazione (pagina, totale, hasNext/hasPrevPage)
function paginate(page, limit, total, data) {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}

// traduce un authCheck negativo (statusCode + message) in una risposta di errore
function handleAuth(res, authCheck) {
  return jsonError(res, authCheck.statusCode, authCheck.message);
}

// risposta di successo con solo un messaggio (es. conferma di un'eliminazione): { success: true, message }
function jsonMessage(res, statusCode, message) {
  return res.status(statusCode).json({
    success: true,
    message
  });
}

// risposta di successo paginata: { success: true, data, pagination }
function jsonPaginated(res, statusCode, page, limit, total, data) {
  return res.status(statusCode).json({
    success: true,
    ...paginate(page, limit, total, data)
  });
}

// crea un errore con statusCode 404, da lanciare e far gestire all'error handler globale
function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

// crea un errore con statusCode 400, da lanciare e far gestire all'error handler globale
function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

module.exports = {
  jsonOk,
  jsonError,
  paginate,
  handleAuth,
  jsonMessage,
  jsonPaginated,
  notFound,
  badRequest
};