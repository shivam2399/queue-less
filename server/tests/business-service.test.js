const app = require('../src/app');
const { sequelize, User, Business, Service } = require('../src/models');
const { createTestClient } = require('./test-client');

const client = createTestClient(app);

let ownerA, ownerB, customerUser;
let tokenA, tokenB, tokenCustomer;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Service.destroy({ where: {}, truncate: true });
  await Business.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });

  // Register Owner A
  const resA = await client.post('/api/v1/auth/register', {
    body: {
      name: 'Owner Alice',
      email: 'alice@clinic.com',
      password: 'Password123!',
      role: 'business_owner'
    }
  });
  ownerA = resA.body.data.user;
  tokenA = resA.body.data.token;

  // Register Owner B
  const resB = await client.post('/api/v1/auth/register', {
    body: {
      name: 'Owner Bob',
      email: 'bob@salon.com',
      password: 'Password123!',
      role: 'business_owner'
    }
  });
  ownerB = resB.body.data.user;
  tokenB = resB.body.data.token;

  // Register Customer
  const resCust = await client.post('/api/v1/auth/register', {
    body: {
      name: 'Charlie Customer',
      email: 'charlie@customer.com',
      password: 'Password123!',
      role: 'customer'
    }
  });
  customerUser = resCust.body.data.user;
  tokenCustomer = resCust.body.data.token;
});

describe('Phase 2 — Business and Services Module Tests', () => {
  describe('Business CRUD & Ownership Security', () => {
    it('should allow business owner to create a business profile', async () => {
      const res = await client.post('/api/v1/businesses', {
        cookies: { token: tokenA },
        body: {
          name: 'Alice Dental Clinic',
          description: 'Top-tier dental health care',
          address: '101 Health Ave, Bhilai',
          phone: '+91 99999 11111',
          openingTime: '09:00',
          closingTime: '17:00',
          timezone: 'Asia/Kolkata'
        }
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.business.name).toBe('Alice Dental Clinic');
      expect(res.body.data.business.ownerId).toBe(ownerA.id);
    });

    it('should forbid customer from creating a business profile', async () => {
      const res = await client.post('/api/v1/businesses', {
        cookies: { token: tokenCustomer },
        body: {
          name: 'Illegal Customer Clinic',
          address: '202 False St',
          openingTime: '09:00',
          closingTime: '17:00'
        }
      });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should prevent Owner B from updating Owner A business (cross-owner isolation)', async () => {
      const createRes = await client.post('/api/v1/businesses', {
        cookies: { token: tokenA },
        body: {
          name: 'Alice Eye Care',
          address: '101 Vision Way',
          openingTime: '10:00',
          closingTime: '18:00'
        }
      });
      const businessId = createRes.body.data.business.id;

      // Bob attempts to update Alice's business
      const updateRes = await client.patch(`/api/v1/businesses/${businessId}`, {
        cookies: { token: tokenB },
        body: {
          name: 'Bob Hijacked Clinic'
        }
      });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.code).toBe('FORBIDDEN');

      // Verify business name was not changed
      const verifyRes = await client.get(`/api/v1/businesses/${businessId}`);
      expect(verifyRes.body.data.business.name).toBe('Alice Eye Care');
    });

    it('should allow public search and discovery of active businesses', async () => {
      await client.post('/api/v1/businesses', {
        cookies: { token: tokenA },
        body: {
          name: 'Green Leaf Pharmacy & Clinic',
          description: 'Prescriptions and doctor visits',
          address: 'Sector 5, Bhilai',
          openingTime: '08:00',
          closingTime: '20:00'
        }
      });

      await client.post('/api/v1/businesses', {
        cookies: { token: tokenB },
        body: {
          name: 'Golden Scissors Hair Studio',
          description: 'Premium haircuts and grooming',
          address: 'Main Market, Raipur',
          openingTime: '10:00',
          closingTime: '21:00'
        }
      });

      // Search for clinic
      const searchRes = await client.get('/api/v1/businesses?search=Clinic');
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.items.length).toBe(1);
      expect(searchRes.body.data.items[0].name).toContain('Green Leaf');

      // Paginated list
      const allRes = await client.get('/api/v1/businesses?page=1&limit=10');
      expect(allRes.status).toBe(200);
      expect(allRes.body.data.items.length).toBe(2);
      expect(allRes.body.data.pagination.totalItems).toBe(2);
    });
  });

  describe('Service Management & Ownership Security', () => {
    let aliceBusinessId;

    beforeEach(async () => {
      const res = await client.post('/api/v1/businesses', {
        cookies: { token: tokenA },
        body: {
          name: 'Alice Dental Clinic',
          address: '101 Health Ave',
          openingTime: '09:00',
          closingTime: '17:00'
        }
      });
      aliceBusinessId = res.body.data.business.id;
    });

    it('should allow business owner to add services to their business', async () => {
      const res = await client.post(`/api/v1/businesses/${aliceBusinessId}/services`, {
        cookies: { token: tokenA },
        body: {
          name: 'Teeth Cleaning',
          description: 'Routine tartar removal and polishing',
          durationMinutes: 30,
          price: 600.00
        }
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service.name).toBe('Teeth Cleaning');
      expect(res.body.data.service.durationMinutes).toBe(30);
      expect(res.body.data.service.price).toBe(600);
    });

    it('should validate service duration (minimum 5 mins) and non-negative price', async () => {
      const res = await client.post(`/api/v1/businesses/${aliceBusinessId}/services`, {
        cookies: { token: tokenA },
        body: {
          name: 'Quick Consultation',
          durationMinutes: 2, // invalid: < 5
          price: -50 // invalid: < 0
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should prevent Owner B from adding services to Owner A business', async () => {
      const res = await client.post(`/api/v1/businesses/${aliceBusinessId}/services`, {
        cookies: { token: tokenB },
        body: {
          name: 'Bob Unauthorized Service',
          durationMinutes: 20,
          price: 250
        }
      });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('should prevent Owner B from modifying or deactivating Owner A service', async () => {
      const serviceRes = await client.post(`/api/v1/businesses/${aliceBusinessId}/services`, {
        cookies: { token: tokenA },
        body: {
          name: 'Root Canal Treatment',
          durationMinutes: 45,
          price: 1500
        }
      });
      const serviceId = serviceRes.body.data.service.id;

      // Bob attempts to update Alice's service
      const updateRes = await client.patch(`/api/v1/services/${serviceId}`, {
        cookies: { token: tokenB },
        body: { price: 50 }
      });
      expect(updateRes.status).toBe(403);

      // Bob attempts to deactivate Alice's service
      const deleteRes = await client.delete(`/api/v1/services/${serviceId}`, {
        cookies: { token: tokenB }
      });
      expect(deleteRes.status).toBe(403);
    });

    it('should soft-delete (deactivate) service preserving appointment integrity', async () => {
      const serviceRes = await client.post(`/api/v1/businesses/${aliceBusinessId}/services`, {
        cookies: { token: tokenA },
        body: {
          name: 'Temporary Promo Service',
          durationMinutes: 15,
          price: 100
        }
      });
      const serviceId = serviceRes.body.data.service.id;

      // Alice deactivates it
      const deleteRes = await client.delete(`/api/v1/services/${serviceId}`, {
        cookies: { token: tokenA }
      });
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.service.isActive).toBe(false);

      // Verify it is no longer listed in public services
      const publicListRes = await client.get(`/api/v1/businesses/${aliceBusinessId}/services`);
      expect(publicListRes.body.data.services.length).toBe(0);

      // Verify row still exists in DB
      const dbService = await Service.findByPk(serviceId);
      expect(dbService).not.toBeNull();
      expect(dbService.is_active).toBe(false);
    });
  });
});
