const { sequelize, Business, Service, BusinessQueue, Appointment, User } = require('../../models');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../utils/errors');

class QueueService {
  getTodayDateString(timezone = 'Asia/Kolkata') {
    // Return YYYY-MM-DD
    const now = new Date();
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone });
      return formatter.format(now);
    } catch (e) {
      return now.toISOString().split('T')[0];
    }
  }

  async getQueueSnapshot(businessId, requestedDate) {
    const business = await Business.findOne({ where: { id: businessId, is_active: true } });
    if (!business) {
      throw new NotFoundError('Business not found or inactive');
    }

    const date = requestedDate || this.getTodayDateString(business.timezone);

    const [queue] = await BusinessQueue.findOrCreate({
      where: { business_id: businessId, queue_date: date },
      defaults: {
        business_id: businessId,
        queue_date: date,
        current_token: 0,
        last_token: 0,
        is_paused: false
      }
    });

    // Current serving appointment
    const servingAppointment = await Appointment.findOne({
      where: {
        business_id: businessId,
        appointment_date: date,
        status: 'serving'
      },
      include: [{ model: Service, as: 'Service' }]
    });

    // Waiting appointments
    const waitingAppointments = await Appointment.findAll({
      where: {
        business_id: businessId,
        appointment_date: date,
        status: 'waiting'
      },
      include: [{ model: Service, as: 'Service' }],
      order: [['token_number', 'ASC']]
    });

    // Calculate wait estimate
    let totalWaitEstimate = 0;
    if (servingAppointment && servingAppointment.Service) {
      totalWaitEstimate += servingAppointment.Service.duration_minutes;
    }
    for (const appt of waitingAppointments) {
      if (appt.Service) {
        totalWaitEstimate += appt.Service.duration_minutes;
      }
    }

    return {
      businessId: business.id,
      businessName: business.name,
      date,
      isPaused: queue.is_paused,
      currentServingToken: servingAppointment ? servingAppointment.token_number : null,
      currentServingAppointmentId: servingAppointment ? servingAppointment.id : null,
      waitingCount: waitingAppointments.length,
      nextTokens: waitingAppointments.slice(0, 5).map(a => a.token_number),
      estimatedWaitMinutes: totalWaitEstimate,
      estimateDisclaimer: 'Waiting time is an estimate and may change based on operational conditions.'
    };
  }

  async callNext(businessId, ownerId, requestedDate) {
    const business = await Business.findByPk(businessId);
    if (!business) {
      throw new NotFoundError('Business not found');
    }
    if (business.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have permission to manage this queue');
    }

    const date = requestedDate || this.getTodayDateString(business.timezone);

    const result = await sequelize.transaction(async (t) => {
      // Find or create queue row and lock it
      const [queue] = await BusinessQueue.findOrCreate({
        where: { business_id: businessId, queue_date: date },
        defaults: {
          business_id: businessId,
          queue_date: date,
          current_token: 0,
          last_token: 0,
          is_paused: false
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (queue.is_paused) {
        throw new ConflictError('Queue is currently paused. Please resume the queue before calling the next customer.');
      }

      // Check if an appointment is already serving
      const activeServing = await Appointment.findOne({
        where: {
          business_id: businessId,
          appointment_date: date,
          status: 'serving'
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (activeServing) {
        throw new ConflictError(`Appointment with Token #${activeServing.token_number} is currently being served. Complete or update it before calling next.`);
      }

      // Find lowest waiting token
      const nextAppointment = await Appointment.findOne({
        where: {
          business_id: businessId,
          appointment_date: date,
          status: 'waiting'
        },
        include: [
          { model: Service, as: 'Service' },
          { model: User, as: 'Customer' }
        ],
        order: [['token_number', 'ASC']],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!nextAppointment) {
        throw new NotFoundError('No waiting appointments in queue for this date');
      }

      nextAppointment.status = 'serving';
      await nextAppointment.save({ transaction: t });

      queue.current_token = nextAppointment.token_number;
      await queue.save({ transaction: t });

      return nextAppointment.toSafeObject({ includeCustomer: true });
    });

    return result;
  }

  async completeCurrent(businessId, ownerId, requestedDate) {
    const business = await Business.findByPk(businessId);
    if (!business) {
      throw new NotFoundError('Business not found');
    }
    if (business.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have permission to manage this queue');
    }

    const date = requestedDate || this.getTodayDateString(business.timezone);

    const result = await sequelize.transaction(async (t) => {
      const servingAppointment = await Appointment.findOne({
        where: {
          business_id: businessId,
          appointment_date: date,
          status: 'serving'
        },
        include: [
          { model: Service, as: 'Service' },
          { model: User, as: 'Customer' }
        ],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!servingAppointment) {
        throw new NotFoundError('No appointment is currently being served');
      }

      servingAppointment.status = 'completed';
      await servingAppointment.save({ transaction: t });

      return servingAppointment.toSafeObject({ includeCustomer: true });
    });

    return result;
  }

  async markNoShow(businessId, ownerId, appointmentId) {
    const business = await Business.findByPk(businessId);
    if (!business) {
      throw new NotFoundError('Business not found');
    }
    if (business.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have permission to manage this queue');
    }

    const result = await sequelize.transaction(async (t) => {
      const appointment = await Appointment.findByPk(appointmentId, {
        include: [
          { model: Service, as: 'Service' },
          { model: User, as: 'Customer' }
        ],
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (!appointment || appointment.business_id !== businessId) {
        throw new NotFoundError('Appointment not found');
      }

      if (appointment.status !== 'waiting' && appointment.status !== 'serving') {
        throw new ConflictError(`Cannot mark appointment as no-show from current status '${appointment.status}'`);
      }

      appointment.status = 'no_show';
      await appointment.save({ transaction: t });

      return appointment.toSafeObject({ includeCustomer: true });
    });

    return result;
  }

  async pauseQueue(businessId, ownerId, isPaused, requestedDate) {
    const business = await Business.findByPk(businessId);
    if (!business) {
      throw new NotFoundError('Business not found');
    }
    if (business.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have permission to manage this queue');
    }

    const date = requestedDate || this.getTodayDateString(business.timezone);

    const [queue] = await BusinessQueue.findOrCreate({
      where: { business_id: businessId, queue_date: date },
      defaults: {
        business_id: businessId,
        queue_date: date,
        current_token: 0,
        last_token: 0,
        is_paused: isPaused
      }
    });

    queue.is_paused = isPaused;
    await queue.save();

    return queue.toSafeObject();
  }
}

module.exports = new QueueService();
