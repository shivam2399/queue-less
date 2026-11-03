const { sequelize, Appointment, Business, Service, BusinessQueue, User } = require('../../models');
const { NotFoundError, ForbiddenError, ConflictError, ValidationError } = require('../../utils/errors');
const queueService = require('../queue/queue.service');

// In-process lock to prevent concurrent transaction collision on single DB connections (e.g. SQLite test memory)
let queueMutex = Promise.resolve();

function withQueueLock(fn) {
  const result = queueMutex.then(fn);
  queueMutex = result.catch(() => {});
  return result;
}

class AppointmentService {
  async bookAppointment(customerId, { businessId, serviceId, appointmentDate }) {
    const business = await Business.findOne({ where: { id: businessId, is_active: true } });
    if (!business) {
      throw new NotFoundError('Business not found or is currently inactive');
    }

    const todayStr = queueService.getTodayDateString(business.timezone);
    if (appointmentDate < todayStr) {
      throw new ValidationError('Appointment date cannot be in the past');
    }

    // Verify service belongs to business and is active
    const service = await Service.findOne({
      where: {
        id: serviceId,
        business_id: businessId,
        is_active: true
      }
    });

    if (!service) {
      throw new NotFoundError('Selected service does not exist or is not available for this business');
    }

    // Transaction with queue lock to ensure atomic, non-conflicting token allocation
    return withQueueLock(async () => {
      return await sequelize.transaction(async (t) => {
        // Find or create daily queue counter row with update lock
        const [queue] = await BusinessQueue.findOrCreate({
          where: { business_id: businessId, queue_date: appointmentDate },
          defaults: {
            business_id: businessId,
            queue_date: appointmentDate,
            current_token: 0,
            last_token: 0,
            is_paused: false
          },
          transaction: t,
          lock: t.LOCK.UPDATE
        });

        // Increment last allocated token
        queue.last_token += 1;
        const tokenNumber = queue.last_token;
        await queue.save({ transaction: t });

        // Calculate waiting appointments ahead and estimated wait
        const waitingAhead = await Appointment.findAll({
          where: {
            business_id: businessId,
            appointment_date: appointmentDate,
            status: 'waiting'
          },
          include: [{ model: Service, as: 'Service' }],
          transaction: t
        });

        const servingAppt = await Appointment.findOne({
          where: {
            business_id: businessId,
            appointment_date: appointmentDate,
            status: 'serving'
          },
          include: [{ model: Service, as: 'Service' }],
          transaction: t
        });

        let estimatedWait = 0;
        if (servingAppt && servingAppt.Service) {
          estimatedWait += servingAppt.Service.duration_minutes;
        }
        for (const ahead of waitingAhead) {
          if (ahead.Service) {
            estimatedWait += ahead.Service.duration_minutes;
          }
        }

        const queuePosition = waitingAhead.length + 1;

        const created = await Appointment.create({
          customer_id: customerId,
          business_id: businessId,
          service_id: serviceId,
          appointment_date: appointmentDate,
          token_number: tokenNumber,
          status: 'waiting',
          estimated_wait_minutes: estimatedWait
        }, { transaction: t });

        const safeAppt = created.toSafeObject();
        safeAppt.business = business.toSafeObject();
        safeAppt.service = service.toSafeObject();
        safeAppt.queuePosition = queuePosition;
        safeAppt.estimateDisclaimer = 'Waiting time is an estimate and may change based on operational conditions.';

        return safeAppt;
      });
    });
  }

  async getMyAppointments(customerId, { status, page = 1, limit = 20 }) {
    const where = { customer_id: customerId };
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include: [
        { model: Business, as: 'Business' },
        { model: Service, as: 'Service' }
      ],
      limit,
      offset,
      order: [
        ['appointment_date', 'DESC'],
        ['token_number', 'DESC']
      ]
    });

    return {
      items: rows.map(a => a.toSafeObject()),
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getBusinessAppointments(businessId, ownerId, { date, status, page = 1, limit = 20 }) {
    const business = await Business.findByPk(businessId);
    if (!business) {
      throw new NotFoundError('Business not found');
    }
    if (business.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have permission to view appointments for this business');
    }

    const where = { business_id: businessId };
    if (date) {
      where.appointment_date = date;
    }
    if (status) {
      where.status = status;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Appointment.findAndCountAll({
      where,
      include: [
        { model: Service, as: 'Service' },
        { model: User, as: 'Customer' }
      ],
      limit,
      offset,
      order: [
        ['token_number', 'ASC']
      ]
    });

    return {
      items: rows.map(a => a.toSafeObject({ includeCustomer: true })),
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getAppointmentById(appointmentId, userId, userRole) {
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        { model: Business, as: 'Business' },
        { model: Service, as: 'Service' },
        { model: User, as: 'Customer' }
      ]
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    const isCustomerOwner = appointment.customer_id === userId;
    const isBusinessOwner = appointment.Business && appointment.Business.owner_id === userId;

    if (!isCustomerOwner && !isBusinessOwner) {
      throw new ForbiddenError('You do not have permission to view this appointment');
    }

    return appointment.toSafeObject({ includeCustomer: isBusinessOwner });
  }

  async cancelAppointment(appointmentId, userId, userRole) {
    const appointment = await Appointment.findByPk(appointmentId, {
      include: [{ model: Business, as: 'Business' }]
    });

    if (!appointment) {
      throw new NotFoundError('Appointment not found');
    }

    const isCustomerOwner = appointment.customer_id === userId;
    const isBusinessOwner = appointment.Business && appointment.Business.owner_id === userId;

    if (!isCustomerOwner && !isBusinessOwner) {
      throw new ForbiddenError('You do not have permission to cancel this appointment');
    }

    if (appointment.status !== 'waiting') {
      throw new ConflictError(`Cannot cancel appointment with status '${appointment.status}'. Only waiting appointments can be cancelled.`);
    }

    appointment.status = 'cancelled';
    await appointment.save();

    return appointment.toSafeObject();
  }
}

module.exports = new AppointmentService();
