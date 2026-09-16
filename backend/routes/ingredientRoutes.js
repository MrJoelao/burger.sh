const express = require('express');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireApprovedManagerOnly } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateRequest');
const { createIngredientSchema } = require('../validations/ingredientValidation');
const { getAllIngredients, createIngredient } = require('../controllers/ingredientController');

const router = express.Router();

router.get('/', paginationMiddleware, getAllIngredients);
router.post('/', authMiddleware, requireApprovedManagerOnly, validate(createIngredientSchema), createIngredient);

module.exports = router;
