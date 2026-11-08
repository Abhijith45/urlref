import { z } from 'zod';

export const createCheckoutSessionSchema = z.object({
  tier: z.enum(['PRO', 'AGENCY']),
  interval: z.enum(['month', 'year']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export type CreateCheckoutSessionInput = z.infer<typeof createCheckoutSessionSchema>;
