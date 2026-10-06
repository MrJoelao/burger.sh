const { jsonError } = require('../utils/httpResponses');

const validate = (schema) => (req, res, next) => {
  /* req.body può restare undefined se la richiesta non ha un body (es. content-type
     assente), quindi va normalizzato prima di validarlo */
  const { error, value } = schema.validate(req.body || {}, { abortEarly: false, stripUnknown: true });
  if (error) {
    /* stesso formato { success: false, message } usato da tutti gli altri
       errori dell'api, invece di una struttura { errors: [...] } a parte */
    return jsonError(res, 400, error.details.map(d => d.message).join('; '));
  }
  req.validated = value; // salvo i dati validati così non serve richiamare schema.validate dentro al controller
  next();
};
module.exports = validate;
