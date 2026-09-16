const express = require('express');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireApprovedManagerOnly } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateRequest');
const { createIngredientSchema } = require('../validations/ingredientValidation');
const { getAllIngredients, createIngredient, updateIngredient, deleteIngredient } = require('../controllers/ingredientController');
const validateObjectId = require('../middlewares/validateObjectId');

const router = express.Router();

router.get('/', authMiddleware, requireApprovedManagerOnly, paginationMiddleware, getAllIngredients);
router.post('/', authMiddleware, requireApprovedManagerOnly, validate(createIngredientSchema), createIngredient);
router.put('/:id', authMiddleware, requireApprovedManagerOnly, validateObjectId('id'), validate(createIngredientSchema), updateIngredient);
router.delete('/:id', authMiddleware, requireApprovedManagerOnly, validateObjectId('id'), deleteIngredient);

module.exports = router;
