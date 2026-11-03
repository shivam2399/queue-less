const { z } = require('zod');

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const getQueueSnapshotSchema = {
  params: z.object({
    businessId: z.coerce.number().positive()
  }),
  query: z.object({
    date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional()
  })
};

const callNextSchema = {
  params: z.object({
    businessId: z.coerce.number().positive()
  }),
  body: z.object({
    date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional()
  }).optional()
};

const completeCurrentSchema = {
  params: z.object({
    businessId: z.coerce.number().positive()
  }),
  body: z.object({
    date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional()
  }).optional()
};

const noShowSchema = {
  params: z.object({
    businessId: z.coerce.number().positive(),
    appointmentId: z.coerce.number().positive()
  })
};

const pauseQueueSchema = {
  params: z.object({
    businessId: z.coerce.number().positive()
  }),
  body: z.object({
    isPaused: z.boolean({ required_error: 'isPaused boolean is required' }),
    date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional()
  })
};

module.exports = {
  getQueueSnapshotSchema,
  callNextSchema,
  completeCurrentSchema,
  noShowSchema,
  pauseQueueSchema
};
