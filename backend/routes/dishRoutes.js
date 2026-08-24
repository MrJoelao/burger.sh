const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
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
router.get('/restaurant/:restaurantId', paginationMiddleware, getDishesByRestaurant);
router.get('/:id', getDishById);

// rotte protette (richiedono autenticazione)
router.post('/', authMiddleware, validate(createDishSchema), createDish);
router.put('/:id', authMiddleware, validate(updateDishSchema), updateDish);
router.delete('/:id', authMiddleware, deleteDish);

module.exports = router;
