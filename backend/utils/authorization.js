const { notFound } = require('./httpResponses');

function isAdmin(user) {
  return user?.role === 'admin';
}

function isManager(user) {
  return user?.role === 'manager';
}

function isCustomer(user) {
  return user?.role === 'customer';
}

function isOwner(ownerId, userId) {
  if (!ownerId || !userId) return false;
  return ownerId.toString() === userId.toString();
}

function unauthorized(message = 'Not authorized to perform this operation', statusCode = 403) {
  return {
    authorized: false,
    statusCode,
    message
  };
}

/* recupera un documento tramite una query mongoose (es. Model.findById(id) o
   Model.findOne(filter)), applicando eventuali populate/select passati come
   query già costruita, oppure lancia un errore 404 con il messaggio indicato.
   pensata per sostituire i vari "findX" ripetuti nei controller (dish,
   payment method, ristorante), che condividevano tutti lo stesso pattern
   "trova per id, 404 se assente". */
async function findOrThrow(query, notFoundMessage) {
  const document = await query;

  if (!document) {
    throw notFound(notFoundMessage);
  }

  return document;
}

module.exports = {
  isAdmin,
  isManager,
  isCustomer,
  isOwner,
  unauthorized,
  findOrThrow
};
