const express = require('express');
const validate = require('../middlewares/validateRequest');
const { registerSchema, loginSchema } = require('../validations/authValidation');
const { register, login } = require('../controllers/authController');

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

module.exports = router;
