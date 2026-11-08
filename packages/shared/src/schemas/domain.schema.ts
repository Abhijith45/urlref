import { z } from 'zod';

export const domainStatusEnum = z.enum(['PENDING', 'VERIFIED', 'ACTIVE', 'FAILED']);
export type DomainStatus = z.infer<typeof domainStatusEnum>;

// Regex for valid FQDN domain or subdomain (e.g. go.brand.com, links.domain.in)
// Requires at least one dot, labels 1-63 chars, TLD at least 2 chars
const FQDN_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

export const createDomainSchema = z.object({
  hostname: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Hostname must be at least 3 characters')
    .max(255, 'Hostname must not exceed 255 characters')
    .refine((val) => !val.startsWith('http://') && !val.startsWith('https://'), {
      message: 'Enter hostname only (e.g. go.yourbrand.com), do not include http:// or https://',
    })
    .refine((val) => !val.includes('/'), {
      message: 'Hostname cannot contain path slashes',
    })
    .refine((val) => FQDN_REGEX.test(val), {
      message: 'Enter a valid fully qualified domain or subdomain (e.g. links.company.com)',
    })
    .refine(
      (val) => {
        const reserved = ['urlref.softics.in', 'apiref.softics.in', 'localhost', 'softics.in'];
        return !reserved.includes(val);
      },
      {
        message: 'This hostname is reserved by the application platform',
      },
    ),
  custom404Url: z
    .string()
    .trim()
    .url('Custom 404 redirect must be a valid URL')
    .max(2048, 'Custom 404 URL cannot exceed 2048 characters')
    .optional()
    .or(z.literal('')),
});

export const updateDomainSchema = z.object({
  custom404Url: z
    .string()
    .trim()
    .url('Custom 404 redirect must be a valid URL')
    .max(2048, 'Custom 404 URL cannot exceed 2048 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
});

export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;

export interface CustomDomainDto {
  id: string;
  hostname: string;
  status: 'PENDING' | 'VERIFIED' | 'ACTIVE' | 'FAILED';
  verificationToken: string;
  cnameTarget: string;
  sslStatus: string;
  custom404Url: string | null;
  createdAt: string;
  updatedAt: string;
  linksCount?: number;
}
