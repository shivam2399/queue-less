const express = require('express');
const router = express.Router();
const businessController = require('./business.controller');
const serviceController = require('../services/service.controller');
const appointmentController = require('../appointments/appointment.controller');
const queueController = require('../queue/queue.controller');

const { validate } = require('../../middleware/validator.middleware');
const {
  createBusinessSchema,
  updateBusinessSchema,
  getBusinessesQuerySchema,
  businessIdParamSchema
} = require('./business.validator');
const { createServiceSchema } = require('../services/service.validator');
const { getBusinessAppointmentsQuerySchema } = require('../appointments/appointment.validator');
const {
  getQueueSnapshotSchema,
  callNextSchema,
  completeCurrentSchema,
  noShowSchema,
  pauseQueueSchema
} = require('../queue/queue.validator');

const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

// Public endpoints
router.get('/', validate(getBusinessesQuerySchema), businessController.getAll);

// Authenticated Business Owner endpoints
router.get('/mine', authenticate, requireRole('business_owner'), businessController.getMine);
router.post('/', authenticate, requireRole('business_owner'), validate(createBusinessSchema), businessController.create);
router.patch('/:businessId', authenticate, requireRole('business_owner'), validate(updateBusinessSchema), businessController.update);

// Public Business Detail
router.get('/:businessId', validate(businessIdParamSchema), businessController.getById);

// Services under a business
router.get('/:businessId/services', validate(businessIdParamSchema), serviceController.getByBusinessId);
router.post(
  '/:businessId/services',
  authenticate,
  requireRole('business_owner'),
  validate(createServiceSchema),
  serviceController.create
);

// Appointments under a business (Owner only)
router.get(
  '/:businessId/appointments',
  authenticate,
  requireRole('business_owner'),
  validate(getBusinessAppointmentsQuerySchema),
  appointmentController.getBusinessAppointments
);

// Queue endpoints
// Public read-only snapshot
router.get(
  '/:businessId/queue',
  validate(getQueueSnapshotSchema),
  queueController.getSnapshot
);

// Owner queue actions
router.post(
  '/:businessId/queue/call-next',
  authenticate,
  requireRole('business_owner'),
  validate(callNextSchema),
  queueController.callNext
);

router.post(
  '/:businessId/queue/complete-current',
  authenticate,
  requireRole('business_owner'),
  validate(completeCurrentSchema),
  queueController.completeCurrent
);

router.post(
  '/:businessId/queue/appointments/:appointmentId/no-show',
  authenticate,
  requireRole('business_owner'),
  validate(noShowSchema),
  queueController.markNoShow
);

router.patch(
  '/:businessId/queue/pause',
  authenticate,
  requireRole('business_owner'),
  validate(pauseQueueSchema),
  queueController.pause
);

module.exports = router;
