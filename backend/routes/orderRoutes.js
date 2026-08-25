const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { createOrderSchema, updateOrderSchema } = require('../validations/orderValidation');
const {
  createOrder,
  getUserOrders,
  getRestaurantOrders,
  getOrderById,
  updateOrderStatus,
  confirmDelivery
} = require('../controllers/orderController');

const router = express.Router();

// rotte protette (richiedono autenticazione)
router.post('/', authMiddleware, validate(createOrderSchema), createOrder);
router.get('/user', authMiddleware, getUserOrders);
router.get('/restaurant/:restaurantId', authMiddleware, validateObjectId('restaurantId'), paginationMiddleware, getRestaurantOrders);
router.get('/:id', authMiddleware, validateObjectId('id'), getOrderById);
router.patch('/:id/status', authMiddleware, validateObjectId('id'), validate(updateOrderSchema), updateOrderStatus);
router.patch('/:id/confirm-delivery', authMiddleware, validateObjectId('id'), confirmDelivery);

module.exports = router;
