const appointmentService = require('./appointment.service');
const { sendSuccess } = require('../../utils/response');

function emitQueueUpdate(req, businessId, date) {
  try {
    const io = req.app.get('io');
    if (io && businessId && date) {
      io.to(`business:${businessId}:date:${date}`).emit('queue:updated', {
        businessId: Number(businessId),
        date,
        version: Date.now()
      });
    }
  } catch (err) {
    console.error('Socket notification error:', err);
  }
}

class AppointmentController {
  async book(req, res, next) {
    try {
      const appointment = await appointmentService.bookAppointment(req.user.id, req.body);
      emitQueueUpdate(req, req.body.businessId, req.body.appointmentDate);
      return sendSuccess(res, { appointment }, 'Appointment booked successfully. Token allocated.', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMine(req, res, next) {
    try {
      const result = await appointmentService.getMyAppointments(req.user.id, req.query);
      return sendSuccess(res, result, 'Customer appointments retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getBusinessAppointments(req, res, next) {
    try {
      const result = await appointmentService.getBusinessAppointments(
        req.params.businessId,
        req.user.id,
        req.query
      );
      return sendSuccess(res, result, 'Business appointments retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const appointment = await appointmentService.getAppointmentById(
        req.params.appointmentId,
        req.user.id,
        req.user.role
      );
      return sendSuccess(res, { appointment }, 'Appointment retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const appointment = await appointmentService.cancelAppointment(
        req.params.appointmentId,
        req.user.id,
        req.user.role
      );
      emitQueueUpdate(req, appointment.businessId, appointment.appointmentDate);
      return sendSuccess(res, { appointment }, 'Appointment cancelled successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppointmentController();
