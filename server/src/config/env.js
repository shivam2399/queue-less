require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_NAME: z.string().default('queueless'),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_DIALECT: z.enum(['mysql', 'sqlite']).default('mysql'),
  JWT_SECRET: z.string().min(16).default('queueless_super_secret_jwt_key_development_32chars'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  CSRF_SECRET: z.string().min(16).default('queueless_super_secret_csrf_key_dev_32chars')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

module.exports = parsed.data;
