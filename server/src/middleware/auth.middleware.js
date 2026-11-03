const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { UnauthorizedError } = require('../utils/errors');
const { User } = require('../models');

async function authenticate(req, res, next) {
  try {
    let token = null;

    // Check HttpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      // Fallback for API clients/tests
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    // Load user from database to ensure account is still active and not deleted
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User account is inactive or not found');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

// Optional authentication: sets req.user if valid token present, but doesn't fail if absent
async function optionalAuthenticate(req, res, next) {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        if (user && user.is_active) {
          req.user = user;
        }
      } catch (e) {
        // Ignore invalid token in optional mode
      }
    }
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  authenticate,
  optionalAuthenticate
};
