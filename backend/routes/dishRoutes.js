const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePasswordChange = require('../middlewares/requirePasswordChange');
const { requireApprovedManager } = require('../middlewares/roleMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { createDishSchema, updateDishSchema } = require('../validations/dishValidation');
const {
  getAllDishes,
  getDishesByRestaurant,
  getDishById,
  createDish,
  updateDish,
  deleteDish
} = require('../controllers/dishController');

const router = express.Router();

// rotte pubbliche
router.get('/', paginationMiddleware, getAllDishes);
router.get('/restaurant/:restaurantId', validateObjectId('restaurantId'), paginationMiddleware, getDishesByRestaurant);
router.get('/:id', validateObjectId('id'), getDishById);

// rotte protette (richiedono autenticazione)
router.post('/', authMiddleware, requireApprovedManager, validate(createDishSchema), createDish);
router.put('/:id', authMiddleware, requireApprovedManager, validateObjectId('id'), validate(updateDishSchema), updateDish);
router.delete('/:id', authMiddleware, requireApprovedManager, validateObjectId('id'), deleteDish);

module.exports = router;
