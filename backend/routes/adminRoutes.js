const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const paginationMiddleware = require('../middlewares/paginationMiddleware');
const validateObjectId = require('../middlewares/validateObjectId');
const { updateUserSchema } = require('../validations/adminValidation');
const { deleteAccountSchema } = require('../validations/userValidation');
const {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStats
} = require('../controllers/adminController');

const router = express.Router();

// tutte le rotte sono riservate all'admin (controllo centralizzato in requireAdmin)
router.get('/users', authMiddleware, requireAdmin, paginationMiddleware, getAllUsers);
router.get('/users/:id', authMiddleware, requireAdmin, validateObjectId('id'), getUserById);
router.patch('/users/:id', authMiddleware, requireAdmin, validateObjectId('id'), validate(updateUserSchema), updateUser);
router.delete('/users/:id', authMiddleware, requireAdmin, validateObjectId('id'), validate(deleteAccountSchema), deleteUser);
router.get('/stats', authMiddleware, requireAdmin, getStats);

module.exports = router;
