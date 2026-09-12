const express = require('express');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getSetupStatus,
  requestPin,
  executeSetup,
  changePassword
} = require('../controllers/setupController');
const { changePasswordSchema } = require('../validations/setupValidation');

const router = express.Router();

// Setup rate limiter: max 5 requests per 15 minutes per IP for setup endpoints
const setupRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many setup requests from this IP, please try again later.'
});

// Setup endpoints (no auth required)
router.get('/status', getSetupStatus);
router.post('/request-pin', setupRateLimiter, requestPin);
router.post('/', setupRateLimiter, executeSetup);

// Change password endpoint (requires auth and mustChangePassword flag)
router.post('/change-password', authMiddleware, validate(changePasswordSchema), changePassword);

module.exports = router;
