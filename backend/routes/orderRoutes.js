const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireApprovedManager } = require('../middlewares/roleMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const {
  createOrderSchema,
  updateOrderSchema,
  addDraftItemSchema,
  updateDraftItemSchema,
  confirmDraftSchema
} = require('../validations/orderValidation');
const {
  createOrder,
  addDraftItem,
  getDraft,
  updateDraftItem,
  removeDraftItem,
  discardDraft,
  confirmDraft,
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

// carrello in bozza (data-model.md §5): registrate prima di GET /:id, altrimenti
// "draft" verrebbe interpretato come id ordine dalla rotta generica sottostante
router.get('/draft', authMiddleware, getDraft);
router.post('/draft/items', authMiddleware, validate(addDraftItemSchema), addDraftItem);
router.patch('/draft/items/:dishId', authMiddleware, validateObjectId('dishId'), validate(updateDraftItemSchema), updateDraftItem);
router.delete('/draft/items/:dishId', authMiddleware, validateObjectId('dishId'), removeDraftItem);
router.delete('/draft', authMiddleware, discardDraft);
router.post('/draft/confirm', authMiddleware, validate(confirmDraftSchema), confirmDraft);

router.get('/user', authMiddleware, paginationMiddleware, getUserOrders);
router.get('/restaurant/:restaurantId', authMiddleware, requireApprovedManager, validateObjectId('restaurantId'), paginationMiddleware, getRestaurantOrders);
router.get('/restaurant/:restaurantId/dashboard', authMiddleware, requireApprovedManager, validateObjectId('restaurantId'), getRestaurantDashboard);
router.get('/:id', authMiddleware, validateObjectId('id'), getOrderById);
router.patch('/:id/status', authMiddleware, requireApprovedManager, validateObjectId('id'), validate(updateOrderSchema), updateOrderStatus);
router.patch('/:id/confirm-delivery', authMiddleware, validateObjectId('id'), confirmDelivery);

module.exports = router;
