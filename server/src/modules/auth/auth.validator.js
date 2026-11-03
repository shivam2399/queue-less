const { z } = require('zod');

const registerSchema = {
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Invalid email address').max(150),
    password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters').max(100),
    role: z.enum(['customer', 'business_owner'], {
      errorMap: () => ({ message: "Role must be either 'customer' or 'business_owner'" })
    })
  })
};

const loginSchema = {
  body: z.object({
    email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Invalid email address'),
    password: z.string({ required_error: 'Password is required' }).min(1, 'Password cannot be empty')
  })
};

module.exports = {
  registerSchema,
  loginSchema
};
