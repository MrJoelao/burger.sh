const { jsonError } = require('../utils/httpResponses');

/* valida i parametri di query string contro uno schema Joi e salva i valori
   in req.validatedQuery. gemello di validateRequest, che invece valida il body
   e scrive su req.validated: tenerli separati evita che un campo di query con
   lo stesso nome di un campo del body si sovrascriva a vicenda.

   utilizzo:
   router.get('/items', validateQuery(itemsQuerySchema), getItemsController);

   nel controller, accedi a:
   const { status } = req.validatedQuery; */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query || {}, { abortEarly: false, stripUnknown: true });
  if (error) {
    /* stesso formato { success: false, message } usato da validateRequest */
    return jsonError(res, 400, error.details.map(d => d.message).join('; '));
  }
  req.validatedQuery = value;
  next();
};

module.exports = validateQuery;
