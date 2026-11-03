const { Service, Business } = require('../../models');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

class ServiceService {
  async getServicesByBusinessId(businessId) {
    const business = await Business.findOne({ where: { id: businessId, is_active: true } });
    if (!business) {
      throw new NotFoundError('Business not found or inactive');
    }

    const services = await Service.findAll({
      where: { business_id: businessId, is_active: true },
      order: [['price', 'ASC']]
    });

    return services.map(s => s.toSafeObject());
  }

  async createService(businessId, ownerId, data) {
    const business = await Business.findByPk(businessId);
    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (business.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have permission to add services to this business');
    }

    const service = await Service.create({
      business_id: businessId,
      name: data.name,
      description: data.description || null,
      duration_minutes: data.durationMinutes,
      price: data.price,
      is_active: true
    });

    return service.toSafeObject();
  }

  async updateService(serviceId, ownerId, data) {
    const service = await Service.findByPk(serviceId, {
      include: [{ model: Business, as: 'Business' }]
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    if (!service.Business || service.Business.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have permission to modify this service');
    }

    const updateFields = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.durationMinutes !== undefined) updateFields.duration_minutes = data.durationMinutes;
    if (data.price !== undefined) updateFields.price = data.price;
    if (data.isActive !== undefined) updateFields.is_active = data.isActive;

    await service.update(updateFields);

    return service.toSafeObject();
  }

  async deactivateService(serviceId, ownerId) {
    const service = await Service.findByPk(serviceId, {
      include: [{ model: Business, as: 'Business' }]
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    if (!service.Business || service.Business.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have permission to delete this service');
    }

    await service.update({ is_active: false });

    return service.toSafeObject();
  }
}

module.exports = new ServiceService();
