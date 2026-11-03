const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { validate } = require('../../middleware/validator.middleware');
const { registerSchema, loginSchema } = require('./auth.validator');
const { authenticate } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rate-limiter.middleware');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getMe);
router.get('/csrf', authController.getCsrf);

module.exports = router;
