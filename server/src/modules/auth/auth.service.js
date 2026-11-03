const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const env = require('../../config/env');
const { ConflictError, UnauthorizedError, NotFoundError } = require('../../utils/errors');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN
    }
  );
}

class AuthService {
  async register({ name, email, password, role }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictError('An account with this email address already exists');
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      is_active: true
    });

    const token = generateToken(user);

    return {
      user: user.toSafeObject(),
      token
    };
  }

  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Your account has been deactivated. Please contact support.');
    }

    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken(user);

    return {
      user: user.toSafeObject(),
      token
    };
  }

  async getMe(userId) {
    const user = await User.findByPk(userId);
    if (!user || !user.is_active) {
      throw new NotFoundError('User not found or inactive');
    }

    return user.toSafeObject();
  }
}

module.exports = new AuthService();
