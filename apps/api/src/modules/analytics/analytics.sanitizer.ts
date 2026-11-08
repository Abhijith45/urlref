import { DeviceType } from '@shortener/shared';

/**
 * Sanitizes the HTTP referrer, stripping private query paths and tokens.
 * Extracts the domain name only.
 */
export function sanitizeReferrer(rawReferrer?: string): string {
  if (!rawReferrer || typeof rawReferrer !== 'string') {
    return 'direct';
  }

  try {
    const parsed = new URL(rawReferrer);
    const host = parsed.hostname.toLowerCase();
    return host || 'direct';
  } catch {
    return 'direct';
  }
}

/**
 * Lightweight, non-backtracking regex classifier for broad device categories.
 * Prevents ReDoS while extracting desktop/mobile/tablet buckets.
 */
export function classifyDeviceType(userAgent?: string): DeviceType {
  if (!userAgent || typeof userAgent !== 'string') {
    return 'desktop';
  }

  const ua = userAgent.toLowerCase();

  // Tablet regex detection
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  // Mobile regex detection
  if (
    /mobile|iphone|ipod|android|blackberry|iemobile|kindle|netfront|opera m(obi|ini)|fennec/i.test(
      ua,
    )
  ) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Validates and normalizes 2-letter ISO 3166-1 alpha-2 country codes.
 */
export function sanitizeCountryCode(code?: string): string | null {
  if (!code || typeof code !== 'string') {
    return null;
  }

  const normalized = code.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : null;
}
