import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),
  APP_BASE_URL: z.string().url().default('http://localhost:5000'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters long'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLERK_SECRET_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRO_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_PRO_ANNUAL_PRICE_ID: z.string().optional(),
  STRIPE_AGENCY_MONTHLY_PRICE_ID: z.string().optional(),
  STRIPE_AGENCY_ANNUAL_PRICE_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment variables:');
  // eslint-disable-next-line no-console
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
