import { prisma } from '../../database/db';
import {
  classifyDeviceType,
  sanitizeCountryCode,
  sanitizeReferrer,
} from '../analytics/analytics.sanitizer';
import { logger } from '../../utils/logger';

export interface ClickDispatchPayload {
  linkId: string;
  rawReferrer?: string;
  userAgent?: string;
  countryCode?: string;
}

/**
 * Dispatches click event persistence asynchronously onto Node's next event loop turn.
 * Guaranteed to NEVER throw unhandled promise rejections or delay the 302 redirect response.
 */
export function dispatchClickEvent(payload: ClickDispatchPayload): void {
  setImmediate(async () => {
    try {
      const sanitizedReferrer = sanitizeReferrer(payload.rawReferrer);
      const sanitizedDevice = classifyDeviceType(payload.userAgent);
      const sanitizedCountry = sanitizeCountryCode(payload.countryCode);

      await prisma.clickEvent.create({
        data: {
          linkId: payload.linkId,
          clickedAt: new Date(),
          referrer: sanitizedReferrer,
          deviceType: sanitizedDevice,
          countryCode: sanitizedCountry,
        },
      });
    } catch (error) {
      // Never crash on background click persistence failure
      logger.warn(
        { error, linkId: payload.linkId },
        'Non-fatal warning: background click event tracking failed',
      );
    }
  });
}
