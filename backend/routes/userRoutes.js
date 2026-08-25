const express = require('express');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const { updateProfileSchema, deleteAccountSchema } = require('../validations/userValidation');
const { getMe, updateMe, deleteMe } = require('../controllers/userController');

const router = express.Router();

// tutte le rotte del profilo operano sull'utente autenticato (req.user.id)
router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, validate(updateProfileSchema), updateMe);
router.delete('/me', authMiddleware, validate(deleteAccountSchema), deleteMe);

module.exports = router;
