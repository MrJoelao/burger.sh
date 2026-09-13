const Joi = require('joi');

const executeSetupSchema = Joi.object({
  pin: Joi.string().pattern(/^\d{6}$/).optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required()
});

module.exports = { executeSetupSchema, changePasswordSchema };
