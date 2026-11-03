const serviceService = require('./service.service');
const { sendSuccess } = require('../../utils/response');

class ServiceController {
  async getByBusinessId(req, res, next) {
    try {
      const services = await serviceService.getServicesByBusinessId(req.params.businessId);
      return sendSuccess(res, { services }, 'Services retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const service = await serviceService.createService(req.params.businessId, req.user.id, req.body);
      return sendSuccess(res, { service }, 'Service created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const service = await serviceService.updateService(req.params.serviceId, req.user.id, req.body);
      return sendSuccess(res, { service }, 'Service updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req, res, next) {
    try {
      const service = await serviceService.deactivateService(req.params.serviceId, req.user.id);
      return sendSuccess(res, { service }, 'Service deactivated successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceController();
