const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const {
  addCartItemSchema,
  updateCartItemSchema,
  confirmCartSchema,
  deliveryEstimateSchema
} = require('../validations/cartValidation');
const {
  addItem,
  getCart,
  updateItem,
  removeItem,
  discardCart,
  confirmCart,
  estimateDelivery
} = require('../controllers/cartController');

const router = express.Router();

// tutte le rotte del carrello richiedono un cliente autenticato
router.get('/', authMiddleware, getCart);
router.post('/items', authMiddleware, validate(addCartItemSchema), addItem);
router.patch('/items/:dishId', authMiddleware, validateObjectId('dishId'), validate(updateCartItemSchema), updateItem);
router.delete('/items/:dishId', authMiddleware, validateObjectId('dishId'), removeItem);
router.delete('/', authMiddleware, discardCart);
router.post('/confirm', authMiddleware, validate(confirmCartSchema), confirmCart);
router.post('/delivery-estimate', authMiddleware, validate(deliveryEstimateSchema), estimateDelivery);

module.exports = router;
