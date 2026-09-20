const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePasswordChange = require('../middlewares/requirePasswordChange');
const { requireAdmin, requireApprovedManager, requireApprovedManagerOnly } = require('../middlewares/roleMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { createRestaurantSchema, updateRestaurantSchema, createFirstRestaurantSchema } = require('../validations/restaurantValidation');
const { deleteAccountSchema } = require('../validations/userValidation');
const {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  createFirstRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require('../controllers/restaurantController');

const router = express.Router();

// rotte pubbliche
router.get('/', paginationMiddleware, getAllRestaurants);
router.get('/:id', validateObjectId('id'), getRestaurantById);

// rotte protette (richiedono autenticazione)
router.post('/', authMiddleware, requireAdmin, validate(createRestaurantSchema), createRestaurant);
router.post('/first', authMiddleware, requireApprovedManagerOnly, validate(createFirstRestaurantSchema), createFirstRestaurant);
router.put('/:id', authMiddleware, requireApprovedManager, validateObjectId('id'), validate(updateRestaurantSchema), updateRestaurant);
router.delete('/:id', authMiddleware, requireApprovedManager, validateObjectId('id'), validate(deleteAccountSchema), deleteRestaurant);

module.exports = router;
