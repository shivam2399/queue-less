const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const createAppointmentSchema = {
  body: z.object({
    businessId: z.coerce.number().positive('Valid business ID is required'),
    serviceId: z.coerce.number().positive('Valid service ID is required'),
    appointmentDate: z.string({ required_error: 'Appointment date is required' }).regex(dateRegex, 'Date must be in YYYY-MM-DD format')
  })
};

const getMyAppointmentsQuerySchema = {
  query: z.object({
    status: z.enum(['waiting', 'serving', 'completed', 'cancelled', 'no_show']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  })
};

const getBusinessAppointmentsQuerySchema = {
  params: z.object({
    businessId: z.coerce.number().positive()
  }),
  query: z.object({
    date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional(),
    status: z.enum(['waiting', 'serving', 'completed', 'cancelled', 'no_show']).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  })
};

const appointmentIdParamSchema = {
  params: z.object({
    appointmentId: z.coerce.number().positive()
  })
};

module.exports = {
  createAppointmentSchema,
  getMyAppointmentsQuerySchema,
  getBusinessAppointmentsQuerySchema,
  appointmentIdParamSchema
};
