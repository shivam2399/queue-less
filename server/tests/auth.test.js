const app = require('../src/app');
const { sequelize, User } = require('../src/models');
const { createTestClient } = require('./test-client');

const client = createTestClient(app);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true });
});

describe('Authentication Module Tests', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register a valid customer account and set session cookie', async () => {
      const res = await client.post('/api/v1/auth/register', {
        body: {
          name: 'Asha Patel',
          email: 'asha@example.com',
          password: 'Password123!',
          role: 'customer'
        }
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('asha@example.com');
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.user.password).toBeUndefined(); // Never return password or hash

      // Check cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.startsWith('token='))).toBe(true);
    });

    it('should register a valid business owner account', async () => {
      const res = await client.post('/api/v1/auth/register', {
        body: {
          name: 'Vikram Mehta',
          email: 'vikram@clinic.com',
          password: 'SecureOwnerPassword1',
          role: 'business_owner'
        }
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('business_owner');
    });

    it('should reject registration with duplicate email', async () => {
      await client.post('/api/v1/auth/register', {
        body: {
          name: 'First User',
          email: 'duplicate@test.com',
          password: 'Password123!',
          role: 'customer'
        }
      });

      const res = await client.post('/api/v1/auth/register', {
        body: {
          name: 'Second User',
          email: 'DUPLICATE@test.com', // Case insensitivity test
          password: 'Password456!',
          role: 'customer'
        }
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('CONFLICT');
    });

    it('should reject invalid email and weak password', async () => {
      const res = await client.post('/api/v1/auth/register', {
        body: {
          name: 'Bad Data',
          email: 'not-an-email',
          password: 'short',
          role: 'customer'
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject registration attempting to assign admin role', async () => {
      const res = await client.post('/api/v1/auth/register', {
        body: {
          name: 'Hacker',
          email: 'hacker@test.com',
          password: 'Password123!',
          role: 'admin'
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await client.post('/api/v1/auth/register', {
        body: {
          name: 'Login User',
          email: 'user@example.com',
          password: 'CorrectPassword123',
          role: 'customer'
        }
      });
    });

    it('should log in successfully with valid credentials and return user profile', async () => {
      const res = await client.post('/api/v1/auth/login', {
        body: {
          email: 'USER@example.com', // case-insensitive login
          password: 'CorrectPassword123'
        }
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('user@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid password with generic error message', async () => {
      const res = await client.post('/api/v1/auth/login', {
        body: {
          email: 'user@example.com',
          password: 'WrongPassword'
        }
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject non-existent email with generic error message', async () => {
      const res = await client.post('/api/v1/auth/login', {
        body: {
          email: 'nonexistent@example.com',
          password: 'SomePassword'
        }
      });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should reject login for deactivated user accounts', async () => {
      const user = await User.findOne({ where: { email: 'user@example.com' } });
      user.is_active = false;
      await user.save();

      const res = await client.post('/api/v1/auth/login', {
        body: {
          email: 'user@example.com',
          password: 'CorrectPassword123'
        }
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('deactivated');
    });
  });

  describe('GET /api/v1/auth/me and POST /api/v1/auth/logout', () => {
    it('should return 401 when accessing /me without token', async () => {
      const res = await client.get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('should return user profile when authenticated with cookie', async () => {
      const registerRes = await client.post('/api/v1/auth/register', {
        body: {
          name: 'Session User',
          email: 'session@example.com',
          password: 'Password123!',
          role: 'customer'
        }
      });

      const token = registerRes.body.data.token;

      const meRes = await client.get('/api/v1/auth/me', {
        cookies: { token }
      });

      expect(meRes.status).toBe(200);
      expect(meRes.body.data.user.email).toBe('session@example.com');
    });

    it('should clear session cookie on logout', async () => {
      const res = await client.post('/api/v1/auth/logout');
      expect(res.status).toBe(200);
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('token=;') || c.includes('Expires='))).toBe(true);
    });
  });
});
