const PaymentMethod = require('../models/PaymentMethod');
const { jsonOk, jsonMessage } = require('../utils/httpResponses');
const { findOrThrow } = require('../utils/authorization');

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
    const paymentMethod = await findOrThrow(
      PaymentMethod.findOne({ _id: req.params.id, customerId: req.user.id }),
      'Payment method not found'
    );

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

    await findOrThrow(
      PaymentMethod.findOne({ _id: id, customerId: req.user.id }),
      'Payment method not found'
    );

    const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(id, updates, {
      returnDocument: 'after',
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
    const paymentMethod = await findOrThrow(
      PaymentMethod.findOne({ _id: req.params.id, customerId: req.user.id }),
      'Payment method not found'
    );

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
