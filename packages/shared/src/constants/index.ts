export const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const DEFAULT_SHORT_CODE_LENGTH = 7;

export const RESERVED_ALIASES = [
  'api',
  'admin',
  'login',
  'register',
  'logout',
  'dashboard',
  'health',
  'ready',
  'metrics',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  's',
  'static',
  'assets',
  'null',
  'undefined',
  'auth',
  'settings',
  'analytics',
  'overview',
  'links',
] as const;

export const RESERVED_ALIASES_SET = new Set<string>(RESERVED_ALIASES);

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  LINK_NOT_FOUND: 'LINK_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  CODE_CONFLICT: 'CODE_CONFLICT',
  LINK_EXPIRED_OR_INACTIVE: 'LINK_EXPIRED_OR_INACTIVE',
  LINK_INACTIVE: 'LINK_INACTIVE',
  LINK_EXPIRED: 'LINK_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const DEVICE_TYPES = ['desktop', 'mobile', 'tablet'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];
