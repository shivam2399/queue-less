const businessService = require('./business.service');
const { sendSuccess } = require('../../utils/response');

class BusinessController {
  async create(req, res, next) {
    try {
      const business = await businessService.createBusiness(req.user.id, req.body);
      return sendSuccess(res, { business }, 'Business profile created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await businessService.getBusinesses(req.query);
      return sendSuccess(res, result, 'Businesses retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const business = await businessService.getBusinessById(req.params.businessId);
      return sendSuccess(res, { business }, 'Business details retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getMine(req, res, next) {
    try {
      const businesses = await businessService.getMyBusinesses(req.user.id);
      return sendSuccess(res, { businesses }, 'Owned businesses retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const business = await businessService.updateBusiness(req.params.businessId, req.user.id, req.body);
      return sendSuccess(res, { business }, 'Business profile updated successfully', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BusinessController();
