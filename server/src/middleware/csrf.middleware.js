const crypto = require('crypto');
const env = require('../config/env');
const { ForbiddenError } = require('../utils/errors');

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function csrfProtection(req, res, next) {
  // Safe HTTP methods do not change state
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  
  // Set CSRF cookie if not present
  if (!req.cookies || !req.cookies.csrf_token) {
    const token = generateCsrfToken();
    const isProduction = env.NODE_ENV === 'production';
    res.cookie('csrf_token', token, {
      httpOnly: false, // Must be readable by client JS to send in X-CSRF-Token header
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      path: '/'
    });
    // Attach to request so later handlers have access
    if (!req.cookies) req.cookies = {};
    req.cookies.csrf_token = token;
  }

  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Bypass CSRF in test environment if configured
  if (env.NODE_ENV === 'test') {
    return next();
  }

  // If request is authenticated via Bearer token in Authorization header, CSRF is not required
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // If request has no cookie session, it is unauthenticated or public (e.g., initial login/register)
  // For login and register, we still allow them, or verify if CSRF token header is provided
  if (!req.cookies || !req.cookies.token) {
    return next();
  }

  // Verify CSRF token for cookie-authenticated state-changing requests
  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies.csrf_token;

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return next(new ForbiddenError('Invalid or missing CSRF token'));
  }

  next();
}

module.exports = {
  csrfProtection,
  generateCsrfToken
};
