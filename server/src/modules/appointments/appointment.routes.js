const express = require('express');
const router = express.Router();
const appointmentController = require('./appointment.controller');
const { validate } = require('../../middleware/validator.middleware');
const {
  createAppointmentSchema,
  getMyAppointmentsQuerySchema,
  appointmentIdParamSchema
} = require('./appointment.validator');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

router.post(
  '/',
  authenticate,
  requireRole('customer'),
  validate(createAppointmentSchema),
  appointmentController.book
);

router.get(
  '/mine',
  authenticate,
  requireRole('customer'),
  validate(getMyAppointmentsQuerySchema),
  appointmentController.getMine
);

router.get(
  '/:appointmentId',
  authenticate,
  validate(appointmentIdParamSchema),
  appointmentController.getById
);

router.patch(
  '/:appointmentId/cancel',
  authenticate,
  validate(appointmentIdParamSchema),
  appointmentController.cancel
);

module.exports = router;
