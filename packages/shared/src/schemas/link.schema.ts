import { z } from 'zod';
import { RESERVED_ALIASES_SET } from '../constants';

export const destinationUrlSchema = z
  .string({ required_error: 'Destination URL is required' })
  .trim()
  .min(1, 'Destination URL cannot be empty')
  .max(2048, 'Destination URL must not exceed 2048 characters')
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Destination URL must be a valid HTTP or HTTPS address' },
  )
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        const host = parsed.hostname.toLowerCase();

        // Prohibit localhost and loopbacks
        if (
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host === '0.0.0.0' ||
          host === '::1'
        ) {
          return false;
        }

        // Prohibit RFC 1918 private subnets and metadata IPs
        const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4Match) {
          const octet1 = parseInt(ipv4Match[1], 10);
          const octet2 = parseInt(ipv4Match[2], 10);

          if (
            octet1 === 10 || // 10.0.0.0/8
            (octet1 === 172 && octet2 >= 16 && octet2 <= 31) || // 172.16.0.0/12
            (octet1 === 192 && octet2 === 168) || // 192.168.0.0/16
            (octet1 === 169 && octet2 === 254) // 169.254.0.0/16 Cloud Metadata & Link-Local
          ) {
            return false;
          }
        }
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Destination URL cannot point to local or private network addresses' },
  );

export const customAliasSchema = z
  .string()
  .trim()
  .min(3, 'Custom alias must be at least 3 characters long')
  .max(32, 'Custom alias must not exceed 32 characters')
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    'Custom alias can only contain alphanumeric characters, underscores, and hyphens',
  )
  .refine((val) => !RESERVED_ALIASES_SET.has(val.toLowerCase()), {
    message: 'This custom alias is reserved by the system',
  });

export const createLinkSchema = z.object({
  destinationUrl: destinationUrlSchema,
  customAlias: customAliasSchema.optional().or(z.literal('')),
  customDomainId: z.string().uuid().optional().nullable(),
  expiresAt: z
    .string()
    .datetime({ offset: true, message: 'Invalid ISO date string' })
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return new Date(val).getTime() > Date.now();
      },
      { message: 'Expiration date must be in the future' },
    ),
});

export type CreateLinkInput = z.infer<typeof createLinkSchema>;

export const updateLinkSchema = z
  .object({
    destinationUrl: destinationUrlSchema.optional(),
    isActive: z.boolean().optional(),
    expiresAt: z
      .string()
      .datetime({ offset: true, message: 'Invalid ISO date string' })
      .optional()
      .nullable()
      .refine(
        (val) => {
          if (!val) return true;
          return new Date(val).getTime() > Date.now();
        },
        { message: 'Expiration date must be in the future' },
      ),
  })
  .refine(
    (data) =>
      data.destinationUrl !== undefined ||
      data.isActive !== undefined ||
      data.expiresAt !== undefined,
    { message: 'At least one field must be provided to update' },
  );

export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
