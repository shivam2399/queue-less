const { Op } = require('sequelize');
const { Business, Service } = require('../../models');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

class BusinessService {
  async createBusiness(ownerId, data) {
    const business = await Business.create({
      owner_id: ownerId,
      name: data.name,
      description: data.description || null,
      address: data.address,
      phone: data.phone || null,
      opening_time: data.openingTime,
      closing_time: data.closingTime,
      timezone: data.timezone || 'Asia/Kolkata',
      is_active: true
    });

    return business.toSafeObject();
  }

  async getBusinesses({ search, page = 1, limit = 20 }) {
    const where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Business.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      items: rows.map(b => b.toSafeObject()),
      pagination: {
        page,
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  async getBusinessById(businessId) {
    const business = await Business.findOne({
      where: { id: businessId, is_active: true },
      include: [
        {
          model: Service,
          as: 'Services',
          where: { is_active: true },
          required: false
        }
      ]
    });

    if (!business) {
      throw new NotFoundError('Business not found or is currently inactive');
    }

    const result = business.toSafeObject();
    result.services = (business.Services || []).map(s => s.toSafeObject());
    return result;
  }

  async getMyBusinesses(ownerId) {
    const businesses = await Business.findAll({
      where: { owner_id: ownerId },
      include: [
        {
          model: Service,
          as: 'Services'
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return businesses.map(b => {
      const safe = b.toSafeObject();
      safe.services = (b.Services || []).map(s => s.toSafeObject());
      return safe;
    });
  }

  async updateBusiness(businessId, ownerId, data) {
    const business = await Business.findByPk(businessId);
    if (!business) {
      throw new NotFoundError('Business not found');
    }

    if (business.owner_id !== ownerId) {
      throw new ForbiddenError('You do not have permission to update this business');
    }

    const updateFields = {};
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.description !== undefined) updateFields.description = data.description;
    if (data.address !== undefined) updateFields.address = data.address;
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.openingTime !== undefined) updateFields.opening_time = data.openingTime;
    if (data.closingTime !== undefined) updateFields.closing_time = data.closingTime;
    if (data.timezone !== undefined) updateFields.timezone = data.timezone;
    if (data.isActive !== undefined) updateFields.is_active = data.isActive;

    await business.update(updateFields);

    return business.toSafeObject();
  }
}

module.exports = new BusinessService();
