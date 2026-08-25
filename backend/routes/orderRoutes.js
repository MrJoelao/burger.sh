const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireApprovedManager } = require('../middlewares/roleMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const {
  createOrderSchema,
  updateOrderStatusSchema
} = require('../validations/orderValidation');
const {
  createOrder,
  getUserOrders,
  getRestaurantOrders,
  getRestaurantDashboard,
  getOrderById,
  updateOrderStatus,
  confirmDelivery
} = require('../controllers/orderController');

const router = express.Router();

// rotte protette (richiedono autenticazione)
router.post('/', authMiddleware, validate(createOrderSchema), createOrder);

/* il carrello in bozza (data-model.md §5) non vive più qui: ha una risorsa
   dedicata, montata su /api/cart (vedi cartRoutes.js) */
router.get('/user', authMiddleware, paginationMiddleware, getUserOrders);
router.get('/restaurant/:restaurantId', authMiddleware, requireApprovedManager, validateObjectId('restaurantId'), paginationMiddleware, getRestaurantOrders);
router.get('/restaurant/:restaurantId/dashboard', authMiddleware, requireApprovedManager, validateObjectId('restaurantId'), getRestaurantDashboard);
router.get('/:id', authMiddleware, validateObjectId('id'), getOrderById);
router.patch('/:id/status', authMiddleware, requireApprovedManager, validateObjectId('id'), validate(updateOrderStatusSchema), updateOrderStatus);
router.patch('/:id/confirm-delivery', authMiddleware, validateObjectId('id'), confirmDelivery);

module.exports = router;
