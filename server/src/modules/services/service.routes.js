const express = require('express');
const router = express.Router();
const serviceController = require('./service.controller');
const { validate } = require('../../middleware/validator.middleware');
const { updateServiceSchema, serviceIdParamSchema } = require('./service.validator');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

router.patch(
  '/:serviceId',
  authenticate,
  requireRole('business_owner'),
  validate(updateServiceSchema),
  serviceController.update
);

router.delete(
  '/:serviceId',
  authenticate,
  requireRole('business_owner'),
  validate(serviceIdParamSchema),
  serviceController.deactivate
);

module.exports = router;
