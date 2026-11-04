const authService = require('./auth.service');
const { sendSuccess } = require('../../utils/response');
const env = require('../../config/env');

function getCookieOptions() {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'None' : 'Lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  };
}

class AuthController {
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body);
      res.cookie('token', token, getCookieOptions());
      
      const csrfToken = req.cookies?.csrf_token;
      return sendSuccess(res, { user, token, csrfToken }, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body);
      res.cookie('token', token, getCookieOptions());

      const csrfToken = req.cookies?.csrf_token;
      return sendSuccess(res, { user, token, csrfToken }, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const isProduction = env.NODE_ENV === 'production';
      res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'None' : 'Lax',
        path: '/'
      });

      return sendSuccess(res, null, 'Logged out successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = req.user.toSafeObject();
      return sendSuccess(res, { user }, 'User profile retrieved', 200);
    } catch (error) {
      next(error);
    }
  }

  async getCsrf(req, res, next) {
    try {
      return sendSuccess(res, { csrfToken: req.cookies?.csrf_token }, 'CSRF token retrieved', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
