const { sequelize, User, Business, Service, BusinessQueue, Appointment } = require('../models');

async function seed() {
  try {
    console.log('Connecting to database for seeding...');
    await sequelize.authenticate();
    await sequelize.sync();

    console.log('Seeding demo users...');
    // Create or find Demo Owner
    let owner = await User.findOne({ where: { email: 'owner@queueless.com' } });
    if (!owner) {
      owner = await User.create({
        name: 'Dr. Vikram Mehta',
        email: 'owner@queueless.com',
        password: 'Password123!',
        role: 'business_owner',
        is_active: true
      });
      console.log('Created demo owner: owner@queueless.com / Password123!');
    }

    // Create or find Demo Customer
    let customer = await User.findOne({ where: { email: 'customer@queueless.com' } });
    if (!customer) {
      customer = await User.create({
        name: 'Asha Patel',
        email: 'customer@queueless.com',
        password: 'Password123!',
        role: 'customer',
        is_active: true
      });
      console.log('Created demo customer: customer@queueless.com / Password123!');
    }

    let customer2 = await User.findOne({ where: { email: 'rahul@example.com' } });
    if (!customer2) {
      customer2 = await User.create({
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        password: 'Password123!',
        role: 'customer',
        is_active: true
      });
    }

    // Create Demo Business
    let clinic = await Business.findOne({ where: { name: 'City Care Clinic', owner_id: owner.id } });
    if (!clinic) {
      clinic = await Business.create({
        owner_id: owner.id,
        name: 'City Care Clinic',
        description: 'Comprehensive family healthcare, outpatient consultations, and routine diagnostics.',
        address: 'Plot 14, Commercial Complex, Sector 6, Bhilai, Chhattisgarh',
        phone: '+91 98765 43210',
        opening_time: '09:00:00',
        closing_time: '18:00:00',
        timezone: 'Asia/Kolkata',
        is_active: true
      });
      console.log('Created demo business: City Care Clinic');

      // Create Services
      const s1 = await Service.create({
        business_id: clinic.id,
        name: 'General Consultation',
        description: 'Standard doctor consultation for primary health checks and acute ailments.',
        duration_minutes: 20,
        price: 300.00,
        is_active: true
      });

      const s2 = await Service.create({
        business_id: clinic.id,
        name: 'Specialist Follow-up',
        description: 'Detailed review of previous reports, ongoing treatment plan, and prescription review.',
        duration_minutes: 30,
        price: 500.00,
        is_active: true
      });

      const s3 = await Service.create({
        business_id: clinic.id,
        name: 'Diagnostic Health Screening',
        description: 'Vital signs review, preventive diagnostic screening, and basic health profiling.',
        duration_minutes: 45,
        price: 850.00,
        is_active: true
      });

      // Seed today's queue and appointments
      const today = new Date().toISOString().split('T')[0];
      const queue = await BusinessQueue.create({
        business_id: clinic.id,
        queue_date: today,
        current_token: 1,
        last_token: 3,
        is_paused: false
      });

      // Appointment 1: Serving
      await Appointment.create({
        customer_id: customer.id,
        business_id: clinic.id,
        service_id: s1.id,
        appointment_date: today,
        token_number: 1,
        status: 'serving',
        estimated_wait_minutes: 0
      });

      // Appointment 2: Waiting
      await Appointment.create({
        customer_id: customer2.id,
        business_id: clinic.id,
        service_id: s2.id,
        appointment_date: today,
        token_number: 2,
        status: 'waiting',
        estimated_wait_minutes: 20
      });

      // Appointment 3: Waiting
      await Appointment.create({
        customer_id: customer.id,
        business_id: clinic.id,
        service_id: s3.id,
        appointment_date: today,
        token_number: 3,
        status: 'waiting',
        estimated_wait_minutes: 50
      });
    }

    // Create Second Demo Business
    let salon = await Business.findOne({ where: { name: 'Luxe Salon & Spa', owner_id: owner.id } });
    if (!salon) {
      salon = await Business.create({
        owner_id: owner.id,
        name: 'Luxe Salon & Spa',
        description: 'Modern hair styling, beard grooming, and facial treatments.',
        address: 'Shop 22, Central Avenue, Raipur, Chhattisgarh',
        phone: '+91 98765 12345',
        opening_time: '10:00:00',
        closing_time: '20:00:00',
        timezone: 'Asia/Kolkata',
        is_active: true
      });

      await Service.create({
        business_id: salon.id,
        name: 'Precision Haircut & Styling',
        description: 'Consultation, wash, haircut, and styling tailored to your preference.',
        duration_minutes: 30,
        price: 450.00,
        is_active: true
      });

      await Service.create({
        business_id: salon.id,
        name: 'Classic Shave & Beard Sculpting',
        description: 'Hot towel treatment, traditional razor shave, and beard contouring.',
        duration_minutes: 25,
        price: 350.00,
        is_active: true
      });

      console.log('Created demo business: Luxe Salon & Spa');
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };
