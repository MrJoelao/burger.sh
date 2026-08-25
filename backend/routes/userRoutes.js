const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { updateProfileSchema, deleteAccountSchema } = require('../validations/userValidation');
const { createPaymentMethodSchema, updatePaymentMethodSchema } = require('../validations/paymentMethodValidation');
const { getMe, updateMe, deleteMe } = require('../controllers/userController');
const {
  getPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
} = require('../controllers/paymentMethodController');

const router = express.Router();

// tutte le rotte del profilo operano sull'utente autenticato (req.user.id)
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, validate(updateProfileSchema), updateMe);
router.delete('/me', authMiddleware, validate(deleteAccountSchema), deleteMe);

// metodi di pagamento del cliente autenticato, sempre sotto req.user.id (nessun id cliente nel path)
router.get('/me/payment-methods', authMiddleware, getPaymentMethods);
router.get('/me/payment-methods/:id', authMiddleware, validateObjectId('id'), getPaymentMethodById);
router.post('/me/payment-methods', authMiddleware, validate(createPaymentMethodSchema), createPaymentMethod);
router.put('/me/payment-methods/:id', authMiddleware, validateObjectId('id'), validate(updatePaymentMethodSchema), updatePaymentMethod);
router.delete('/me/payment-methods/:id', authMiddleware, validateObjectId('id'), deletePaymentMethod);

module.exports = router;
