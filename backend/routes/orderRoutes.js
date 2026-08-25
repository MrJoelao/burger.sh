const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
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

// Protected routes (all require authentication)
router.post('/', authMiddleware, validate(createOrderSchema), createOrder);
router.get('/user', authMiddleware, getUserOrders);
router.get('/restaurant/:restaurantId', authMiddleware, paginationMiddleware, getRestaurantOrders);
router.get('/:id', authMiddleware, getOrderById);
router.patch('/:id/status', authMiddleware, validate(updateOrderSchema), updateOrderStatus);
router.patch('/:id/confirm-delivery', authMiddleware, confirmDelivery);

module.exports = router;
