const queueService = require('./queue.service');
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

class QueueController {
  async getSnapshot(req, res, next) {
    try {
      const snapshot = await queueService.getQueueSnapshot(req.params.businessId, req.query.date);
      return sendSuccess(res, snapshot, 'Queue snapshot retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async callNext(req, res, next) {
    try {
      const appointment = await queueService.callNext(
        req.params.businessId,
        req.user.id,
        req.body?.date
      );
      emitQueueUpdate(req, req.params.businessId, appointment.appointmentDate);
      return sendSuccess(res, { appointment }, 'Next customer called successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async completeCurrent(req, res, next) {
    try {
      const appointment = await queueService.completeCurrent(
        req.params.businessId,
        req.user.id,
        req.body?.date
      );
      emitQueueUpdate(req, req.params.businessId, appointment.appointmentDate);
      return sendSuccess(res, { appointment }, 'Current appointment completed successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async markNoShow(req, res, next) {
    try {
      const appointment = await queueService.markNoShow(
        req.params.businessId,
        req.user.id,
        req.params.appointmentId
      );
      emitQueueUpdate(req, req.params.businessId, appointment.appointmentDate);
      return sendSuccess(res, { appointment }, 'Appointment marked as no-show successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async pause(req, res, next) {
    try {
      const queue = await queueService.pauseQueue(
        req.params.businessId,
        req.user.id,
        req.body.isPaused,
        req.body.date
      );
      emitQueueUpdate(req, req.params.businessId, queue.queueDate);
      const message = queue.isPaused ? 'Queue paused successfully' : 'Queue resumed successfully';
      return sendSuccess(res, { queue }, message, 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QueueController();
