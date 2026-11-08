import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(100).optional(),
  status: z.enum(['all', 'active', 'inactive', 'expired']).default('all'),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

export const analyticsQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true, message: 'Invalid start date format' }).optional(),
    to: z.string().datetime({ offset: true, message: 'Invalid end date format' }).optional(),
    interval: z.enum(['day', 'hour']).default('day'),
  })
  .refine(
    (data) => {
      if (data.from && data.to) {
        return new Date(data.from).getTime() <= new Date(data.to).getTime();
      }
      return true;
    },
    { message: 'Start date (from) must be before or equal to end date (to)' },
  );

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

export const linkIdParamSchema = z.object({
  id: z.string().uuid('Invalid link ID format'),
});

export type LinkIdParamInput = z.infer<typeof linkIdParamSchema>;

export const codeParamSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Short code cannot be empty')
    .max(32, 'Short code cannot exceed 32 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Short code contains invalid characters'),
});

export type CodeParamInput = z.infer<typeof codeParamSchema>;
