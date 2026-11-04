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
  let token = req.cookies && req.cookies.csrf_token;
  if (!token) {
    token = generateCsrfToken();
    const isProduction = env.NODE_ENV === 'production';
    res.cookie('csrf_token', token, {
      httpOnly: false, // Must be readable by client JS or returned in header
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      path: '/'
    });
    // Attach to request so later handlers have access
    if (!req.cookies) req.cookies = {};
    req.cookies.csrf_token = token;
  }

  // Always expose X-CSRF-Token on response headers for cross-origin SPAs
  res.setHeader('X-CSRF-Token', token);

  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Bypass CSRF in test environment if configured
  if (env.NODE_ENV === 'test') {
    return next();
  }

  // Always exempt login and register endpoints from CSRF verification
  if (req.path.endsWith('/login') || req.path.endsWith('/register')) {
    return next();
  }

  // If request is authenticated via Bearer token in Authorization header, CSRF is not required
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // If request has no cookie session, it is unauthenticated (handled by auth middleware)
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
