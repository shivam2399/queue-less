const { sequelize, Sequelize } = require('../config/database');

const defineUser = require('./user.model');
const defineBusiness = require('./business.model');
const defineService = require('./service.model');
const defineBusinessQueue = require('./business-queue.model');
const defineAppointment = require('./appointment.model');

const User = defineUser(sequelize);
const Business = defineBusiness(sequelize);
const Service = defineService(sequelize);
const BusinessQueue = defineBusinessQueue(sequelize);
const Appointment = defineAppointment(sequelize);

// User <-> Business (Owner)
User.hasMany(Business, { as: 'OwnedBusinesses', foreignKey: 'owner_id', onDelete: 'RESTRICT' });
Business.belongsTo(User, { as: 'Owner', foreignKey: 'owner_id' });

// Business <-> Service
Business.hasMany(Service, { as: 'Services', foreignKey: 'business_id', onDelete: 'RESTRICT' });
Service.belongsTo(Business, { as: 'Business', foreignKey: 'business_id' });

// Business <-> BusinessQueue
Business.hasMany(BusinessQueue, { as: 'Queues', foreignKey: 'business_id', onDelete: 'CASCADE' });
BusinessQueue.belongsTo(Business, { as: 'Business', foreignKey: 'business_id' });

// Business <-> Appointment
Business.hasMany(Appointment, { as: 'Appointments', foreignKey: 'business_id', onDelete: 'RESTRICT' });
Appointment.belongsTo(Business, { as: 'Business', foreignKey: 'business_id' });

// User <-> Appointment (Customer)
User.hasMany(Appointment, { as: 'CustomerAppointments', foreignKey: 'customer_id', onDelete: 'RESTRICT' });
Appointment.belongsTo(User, { as: 'Customer', foreignKey: 'customer_id' });

// Service <-> Appointment
Service.hasMany(Appointment, { as: 'Appointments', foreignKey: 'service_id', onDelete: 'RESTRICT' });
Appointment.belongsTo(Service, { as: 'Service', foreignKey: 'service_id' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Business,
  Service,
  BusinessQueue,
  Appointment
};
