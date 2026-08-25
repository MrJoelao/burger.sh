const mongoose = require('mongoose');
const { jsonError } = require('../utils/httpResponses');

/* middleware per validare che uno o più parametri di rotta siano ObjectId
   Mongo validi, prima che arrivino a una query Mongoose. senza questo
   controllo, un id malformato (es. "abc") genera un CastError che finisce
   nell'error handler generico come 500 invece di un più corretto 400.

   utilizzo:
   router.get('/:id', validateObjectId('id'), getItemController);
   router.get('/:restaurantId/dishes', validateObjectId('restaurantId'), getDishesController); */
function validateObjectId(...paramNames) {
  return function (req, res, next) {
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return jsonError(res, 400, `Invalid ${paramName}`);
      }
    }

    return next();
  };
}

module.exports = validateObjectId;
