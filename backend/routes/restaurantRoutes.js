const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const { createRestaurantSchema, updateRestaurantSchema } = require('../validations/restaurantValidation');
const {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require('../controllers/restaurantController');

const router = express.Router();

// Public routes
router.get('/', paginationMiddleware, getAllRestaurants);
router.get('/:id', getRestaurantById);

// Protected routes (require authentication)
router.post('/', authMiddleware, requireAdmin, validate(createRestaurantSchema), createRestaurant);
router.put('/:id', authMiddleware, validate(updateRestaurantSchema), updateRestaurant);
router.delete('/:id', authMiddleware, requireAdmin, deleteRestaurant);

module.exports = router;
