const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

const createBusinessSchema = {
  body: z.object({
    name: z.string({ required_error: 'Business name is required' }).trim().min(2).max(150),
    description: z.string().trim().max(1000).optional().nullable(),
    address: z.string({ required_error: 'Address is required' }).trim().min(5).max(255),
    phone: z.string().trim().max(20).optional().nullable(),
    openingTime: z.string({ required_error: 'Opening time is required' }).regex(timeRegex, 'Opening time must be in HH:MM format'),
    closingTime: z.string({ required_error: 'Closing time is required' }).regex(timeRegex, 'Closing time must be in HH:MM format'),
    timezone: z.string().default('Asia/Kolkata')
  })
};

const updateBusinessSchema = {
  params: z.object({
    businessId: z.coerce.number().positive()
  }),
  body: z.object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    address: z.string().trim().min(5).max(255).optional(),
    phone: z.string().trim().max(20).optional().nullable(),
    openingTime: z.string().regex(timeRegex, 'Opening time must be in HH:MM format').optional(),
    closingTime: z.string().regex(timeRegex, 'Closing time must be in HH:MM format').optional(),
    timezone: z.string().optional(),
    isActive: z.boolean().optional()
  })
};

const getBusinessesQuerySchema = {
  query: z.object({
    search: z.string().trim().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  })
};

const businessIdParamSchema = {
  params: z.object({
    businessId: z.coerce.number().positive()
  })
};

module.exports = {
  createBusinessSchema,
  updateBusinessSchema,
  getBusinessesQuerySchema,
  businessIdParamSchema
};
