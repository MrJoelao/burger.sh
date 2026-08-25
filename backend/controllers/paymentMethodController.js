const PaymentMethod = require('../models/PaymentMethod');
const { jsonOk, jsonMessage, notFound } = require('../utils/httpResponses');

/* CRUD dei metodi di pagamento del cliente autenticato: ogni operazione è
   ristretta a req.user.id, così un cliente non può leggere o modificare i
   metodi di pagamento di un altro utente (nessun id cliente nel path,
   stesso pattern già usato in userController per /me). */

/* azzera isDefault su tutti gli altri metodi di pagamento del cliente, per
   garantire che ce ne sia al più uno predefinito alla volta. va chiamata
   prima di salvare un metodo con isDefault true. */
async function clearOtherDefaults(customerId, excludeId) {
  await PaymentMethod.updateMany(
    { customerId, _id: { $ne: excludeId } },
    { isDefault: false }
  );
}

/* recupera un metodo di pagamento per id, verificando che appartenga al
   cliente autenticato, oppure lancia un errore 404 */
async function findOwnPaymentMethod(id, customerId) {
  const paymentMethod = await PaymentMethod.findOne({ _id: id, customerId });

  if (!paymentMethod) {
    throw notFound('Payment method not found');
  }

  return paymentMethod;
}

// get tutti i metodi di pagamento del cliente autenticato
async function getMyPaymentMethods(req, res, next) {
  try {
    const paymentMethods = await PaymentMethod.find({ customerId: req.user.id });

    return jsonOk(res, 200, paymentMethods);
  } catch (err) {
    return next(err);
  }
}

// get un metodo di pagamento specifico del cliente autenticato
async function getPaymentMethodById(req, res, next) {
  try {
    const paymentMethod = await findOwnPaymentMethod(req.params.id, req.user.id);

    return jsonOk(res, 200, paymentMethod);
  } catch (err) {
    return next(err);
  }
}

// create metodo di pagamento per il cliente autenticato
async function createPaymentMethod(req, res, next) {
  try {
    const { type, label, details, isDefault } = req.validated;

    const paymentMethod = await PaymentMethod.create({
      customerId: req.user.id,
      type,
      label,
      details,
      isDefault: Boolean(isDefault)
    });

    if (paymentMethod.isDefault) {
      await clearOtherDefaults(req.user.id, paymentMethod._id);
    }

    return jsonOk(res, 201, paymentMethod);
  } catch (err) {
    return next(err);
  }
}

// update metodo di pagamento del cliente autenticato (type non modificabile dopo la creazione)
async function updatePaymentMethod(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.validated;

    await findOwnPaymentMethod(id, req.user.id);

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (updatedPaymentMethod.isDefault) {
      await clearOtherDefaults(req.user.id, updatedPaymentMethod._id);
    }

    return jsonOk(res, 200, updatedPaymentMethod);
  } catch (err) {
    return next(err);
  }
}

// delete metodo di pagamento del cliente autenticato
async function deletePaymentMethod(req, res, next) {
  try {
    const paymentMethod = await findOwnPaymentMethod(req.params.id, req.user.id);

    await PaymentMethod.findByIdAndDelete(paymentMethod._id);

    return jsonMessage(res, 200, 'Payment method deleted successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMyPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
};
