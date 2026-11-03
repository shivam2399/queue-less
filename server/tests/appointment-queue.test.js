const app = require('../src/app');
const { sequelize, User, Business, Service, BusinessQueue, Appointment } = require('../src/models');
const { createTestClient } = require('./test-client');

const client = createTestClient(app);

let owner1, owner2, customer1, customer2;
let tokenOwner1, tokenOwner2, tokenCustomer1, tokenCustomer2;
let business1, business2, service1, service2;
const todayStr = '2026-11-04'; // Future date relative to test runner

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Appointment.destroy({ where: {}, truncate: true });
  await BusinessQueue.destroy({ where: {}, truncate: true });
  await Service.destroy({ where: {}, truncate: true });
  await Business.destroy({ where: {}, truncate: true });
  await User.destroy({ where: {}, truncate: true });

  // Create Owner 1
  const rO1 = await client.post('/api/v1/auth/register', {
    body: { name: 'Owner One', email: 'owner1@test.com', password: 'Password123!', role: 'business_owner' }
  });
  owner1 = rO1.body.data.user;
  tokenOwner1 = rO1.body.data.token;

  // Create Owner 2
  const rO2 = await client.post('/api/v1/auth/register', {
    body: { name: 'Owner Two', email: 'owner2@test.com', password: 'Password123!', role: 'business_owner' }
  });
  owner2 = rO2.body.data.user;
  tokenOwner2 = rO2.body.data.token;

  // Create Customer 1
  const rC1 = await client.post('/api/v1/auth/register', {
    body: { name: 'Customer One', email: 'cust1@test.com', password: 'Password123!', role: 'customer' }
  });
  customer1 = rC1.body.data.user;
  tokenCustomer1 = rC1.body.data.token;

  // Create Customer 2
  const rC2 = await client.post('/api/v1/auth/register', {
    body: { name: 'Customer Two', email: 'cust2@test.com', password: 'Password123!', role: 'customer' }
  });
  customer2 = rC2.body.data.user;
  tokenCustomer2 = rC2.body.data.token;

  // Create Business 1 for Owner 1
  const rB1 = await client.post('/api/v1/businesses', {
    cookies: { token: tokenOwner1 },
    body: {
      name: 'Clinic Alpha',
      address: '100 Alpha Road',
      openingTime: '09:00',
      closingTime: '18:00'
    }
  });
  business1 = rB1.body.data.business;

  // Create Business 2 for Owner 2
  const rB2 = await client.post('/api/v1/businesses', {
    cookies: { token: tokenOwner2 },
    body: {
      name: 'Salon Beta',
      address: '200 Beta Road',
      openingTime: '10:00',
      closingTime: '19:00'
    }
  });
  business2 = rB2.body.data.business;

  // Create Service 1 under Business 1
  const rS1 = await client.post(`/api/v1/businesses/${business1.id}/services`, {
    cookies: { token: tokenOwner1 },
    body: { name: 'General Consultation', durationMinutes: 20, price: 300 }
  });
  service1 = rS1.body.data.service;

  // Create Service 2 under Business 2
  const rS2 = await client.post(`/api/v1/businesses/${business2.id}/services`, {
    cookies: { token: tokenOwner2 },
    body: { name: 'Haircut', durationMinutes: 30, price: 400 }
  });
  service2 = rS2.body.data.service;
});

describe('Phase 3 — Appointment and Queue Engine Tests', () => {
  describe('Transactional Booking & Token Allocation', () => {
    it('should allocate Token 1 for first booking of the day', async () => {
      const res = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer1 },
        body: {
          businessId: business1.id,
          serviceId: service1.id,
          appointmentDate: todayStr
        }
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.appointment.tokenNumber).toBe(1);
      expect(res.body.data.appointment.status).toBe('waiting');
      expect(res.body.data.appointment.queuePosition).toBe(1);
      expect(res.body.data.appointment.estimatedWaitMinutes).toBe(0);
    });

    it('should sequentially allocate Token 2 for second booking', async () => {
      // First booking
      await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer1 },
        body: {
          businessId: business1.id,
          serviceId: service1.id,
          appointmentDate: todayStr
        }
      });

      // Second booking
      const res2 = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer2 },
        body: {
          businessId: business1.id,
          serviceId: service1.id,
          appointmentDate: todayStr
        }
      });

      expect(res2.status).toBe(201);
      expect(res2.body.data.appointment.tokenNumber).toBe(2);
      expect(res2.body.data.appointment.queuePosition).toBe(2);
      expect(res2.body.data.appointment.estimatedWaitMinutes).toBe(20);
    });

    it('should allow different businesses to independently allocate Token 1 on same date', async () => {
      // Business 1 booking
      const r1 = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer1 },
        body: {
          businessId: business1.id,
          serviceId: service1.id,
          appointmentDate: todayStr
        }
      });
      expect(r1.body.data.appointment.tokenNumber).toBe(1);

      // Business 2 booking
      const r2 = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer2 },
        body: {
          businessId: business2.id,
          serviceId: service2.id,
          appointmentDate: todayStr
        }
      });
      expect(r2.body.data.appointment.tokenNumber).toBe(1);
    });

    it('should not reuse token number if earlier token was cancelled', async () => {
      // Customer 1 books Token 1
      const book1 = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer1 },
        body: {
          businessId: business1.id,
          serviceId: service1.id,
          appointmentDate: todayStr
        }
      });
      const appt1Id = book1.body.data.appointment.id;

      // Customer 1 cancels Token 1
      const cancelRes = await client.patch(`/api/v1/appointments/${appt1Id}/cancel`, {
        cookies: { token: tokenCustomer1 }
      });
      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.data.appointment.status).toBe('cancelled');

      // Customer 2 books on same date -> MUST receive Token 2, NOT Token 1!
      const book2 = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer2 },
        body: {
          businessId: business1.id,
          serviceId: service1.id,
          appointmentDate: todayStr
        }
      });
      expect(book2.status).toBe(201);
      expect(book2.body.data.appointment.tokenNumber).toBe(2);
    });

    it('should reject booking with past dates', async () => {
      const res = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer1 },
        body: {
          businessId: business1.id,
          serviceId: service1.id,
          appointmentDate: '2020-01-01'
        }
      });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('should reject booking if service belongs to a different business', async () => {
      const res = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer1 },
        body: {
          businessId: business1.id,
          serviceId: service2.id, // service 2 belongs to business 2!
          appointmentDate: todayStr
        }
      });

      expect(res.status).toBe(404);
    });

    it('should handle concurrent bookings without allocating duplicate tokens', async () => {
      // Execute 5 concurrent booking requests
      const promises = [1, 2, 3, 4, 5].map((i) =>
        client.post('/api/v1/appointments', {
          cookies: { token: i % 2 === 0 ? tokenCustomer1 : tokenCustomer2 },
          body: {
            businessId: business1.id,
            serviceId: service1.id,
            appointmentDate: todayStr
          }
        })
      );

      const results = await Promise.all(promises);

      // Verify all 5 succeeded
      for (const res of results) {
        expect(res.status).toBe(201);
      }

      // Collect tokens and verify they are unique: [1, 2, 3, 4, 5]
      const tokens = results.map(r => r.body.data.appointment.tokenNumber).sort((a, b) => a - b);
      expect(tokens).toEqual([1, 2, 3, 4, 5]);

      // Verify DB uniqueness constraint
      const count = await Appointment.count({
        where: { business_id: business1.id, appointment_date: todayStr }
      });
      expect(count).toBe(5);
    });
  });

  describe('Queue State Machine Transitions', () => {
    let appt1Id, appt2Id, appt3Id;

    beforeEach(async () => {
      // Create 3 waiting appointments for business 1
      const r1 = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer1 },
        body: { businessId: business1.id, serviceId: service1.id, appointmentDate: todayStr }
      });
      appt1Id = r1.body.data.appointment.id;

      const r2 = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer2 },
        body: { businessId: business1.id, serviceId: service1.id, appointmentDate: todayStr }
      });
      appt2Id = r2.body.data.appointment.id;

      const r3 = await client.post('/api/v1/appointments', {
        cookies: { token: tokenCustomer1 },
        body: { businessId: business1.id, serviceId: service1.id, appointmentDate: todayStr }
      });
      appt3Id = r3.body.data.appointment.id;
    });

    it('should call next and transition lowest token from waiting to serving', async () => {
      const callRes = await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });

      expect(callRes.status).toBe(200);
      expect(callRes.body.data.appointment.tokenNumber).toBe(1);
      expect(callRes.body.data.appointment.status).toBe('serving');

      // Verify public queue snapshot shows Token 1 as serving
      const snapRes = await client.get(`/api/v1/businesses/${business1.id}/queue?date=${todayStr}`);
      expect(snapRes.body.data.currentServingToken).toBe(1);
      expect(snapRes.body.data.waitingCount).toBe(2);
      expect(snapRes.body.data.nextTokens).toEqual([2, 3]);
    });

    it('should conflict (409) if owner calls next while another appointment is still serving', async () => {
      // First call-next succeeds
      await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });

      // Second call-next immediately attempted without completing Token 1
      const callRes2 = await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });

      expect(callRes2.status).toBe(409);
      expect(callRes2.body.code).toBe('CONFLICT');
      expect(callRes2.body.message).toContain('currently being served');
    });

    it('should complete current appointment and then allow calling next', async () => {
      // Call Token 1
      await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });

      // Complete Token 1
      const compRes = await client.post(`/api/v1/businesses/${business1.id}/queue/complete-current`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });

      expect(compRes.status).toBe(200);
      expect(compRes.body.data.appointment.status).toBe('completed');

      // Now Call Token 2
      const callRes2 = await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });

      expect(callRes2.status).toBe(200);
      expect(callRes2.body.data.appointment.tokenNumber).toBe(2);
      expect(callRes2.body.data.appointment.status).toBe('serving');
    });

    it('should skip cancelled appointments when advancing queue', async () => {
      // Customer cancels Token 1
      await client.patch(`/api/v1/appointments/${appt1Id}/cancel`, {
        cookies: { token: tokenCustomer1 }
      });

      // Owner calls next -> MUST select Token 2, skipping cancelled Token 1
      const callRes = await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });

      expect(callRes.status).toBe(200);
      expect(callRes.body.data.appointment.tokenNumber).toBe(2);
      expect(callRes.body.data.appointment.status).toBe('serving');
    });

    it('should mark appointment as no-show and allow calling next', async () => {
      // Call Token 1
      await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });

      // Mark Token 1 no-show
      const noShowRes = await client.post(`/api/v1/businesses/${business1.id}/queue/appointments/${appt1Id}/no-show`, {
        cookies: { token: tokenOwner1 }
      });
      expect(noShowRes.status).toBe(200);
      expect(noShowRes.body.data.appointment.status).toBe('no_show');

      // Now Call Token 2
      const callNextRes = await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });
      expect(callNextRes.status).toBe(200);
      expect(callNextRes.body.data.appointment.tokenNumber).toBe(2);
    });

    it('should block call-next when queue is paused', async () => {
      // Pause queue
      const pauseRes = await client.patch(`/api/v1/businesses/${business1.id}/queue/pause`, {
        cookies: { token: tokenOwner1 },
        body: { isPaused: true, date: todayStr }
      });
      expect(pauseRes.status).toBe(200);
      expect(pauseRes.body.data.queue.isPaused).toBe(true);

      // Attempt call-next -> Expect 409 CONFLICT
      const callRes = await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });
      expect(callRes.status).toBe(409);
      expect(callRes.body.message).toContain('paused');

      // Resume queue
      await client.patch(`/api/v1/businesses/${business1.id}/queue/pause`, {
        cookies: { token: tokenOwner1 },
        body: { isPaused: false, date: todayStr }
      });

      // Now call-next succeeds
      const callRes2 = await client.post(`/api/v1/businesses/${business1.id}/queue/call-next`, {
        cookies: { token: tokenOwner1 },
        body: { date: todayStr }
      });
      expect(callRes2.status).toBe(200);
    });

    it('should protect public queue privacy (no customer PII)', async () => {
      const snapRes = await client.get(`/api/v1/businesses/${business1.id}/queue?date=${todayStr}`);
      expect(snapRes.status).toBe(200);

      const data = snapRes.body.data;
      expect(data.businessName).toBe('Clinic Alpha');
      expect(data.waitingCount).toBe(3);
      expect(data.nextTokens).toEqual([1, 2, 3]);

      // CRITICAL: Ensure NO customer email, phone, or name is in public snapshot
      expect(JSON.stringify(data)).not.toContain('cust1@test.com');
      expect(JSON.stringify(data)).not.toContain('Customer One');
    });

    it('should prevent Customer 2 from viewing or cancelling Customer 1 appointment', async () => {
      // Customer 2 attempts to read Customer 1's appointment
      const getRes = await client.get(`/api/v1/appointments/${appt1Id}`, {
        cookies: { token: tokenCustomer2 }
      });
      expect(getRes.status).toBe(403);

      // Customer 2 attempts to cancel Customer 1's appointment
      const cancelRes = await client.patch(`/api/v1/appointments/${appt1Id}/cancel`, {
        cookies: { token: tokenCustomer2 }
      });
      expect(cancelRes.status).toBe(403);
    });
  });
});
