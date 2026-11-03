const { z } = require('zod');

const createServiceSchema = {
  params: z.object({
    businessId: z.coerce.number().positive()
  }),
  body: z.object({
    name: z.string({ required_error: 'Service name is required' }).trim().min(2).max(150),
    description: z.string().trim().max(1000).optional().nullable(),
    durationMinutes: z.coerce.number({ required_error: 'Duration is required' }).int().min(5, 'Duration must be at least 5 minutes'),
    price: z.coerce.number({ required_error: 'Price is required' }).min(0, 'Price must be non-negative')
  })
};

const updateServiceSchema = {
  params: z.object({
    serviceId: z.coerce.number().positive()
  }),
  body: z.object({
    name: z.string().trim().min(2).max(150).optional(),
    description: z.string().trim().max(1000).optional().nullable(),
    durationMinutes: z.coerce.number().int().min(5).optional(),
    price: z.coerce.number().min(0).optional(),
    isActive: z.boolean().optional()
  })
};

const serviceIdParamSchema = {
  params: z.object({
    serviceId: z.coerce.number().positive()
  })
};

module.exports = {
  createServiceSchema,
  updateServiceSchema,
  serviceIdParamSchema
};
