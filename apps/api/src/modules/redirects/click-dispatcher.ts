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

interface QueuedClickEvent {
  linkId: string;
  clickedAt: Date;
  referrer: string | null;
  deviceType: string;
  countryCode: string | null;
}

const MAX_QUEUE_SIZE = 5000;
const FLUSH_THRESHOLD = 50;
const FLUSH_INTERVAL_MS = 1000;

let clickQueue: QueuedClickEvent[] = [];
let isFlushing = false;

/**
 * Flushes all currently queued click events in a single bulk database insert.
 * Dramatically reduces write IOPS and connection pool contention under heavy traffic.
 */
export async function flushClickQueue(): Promise<number> {
  if (clickQueue.length === 0 || isFlushing) {
    return 0;
  }

  isFlushing = true;
  // Atomically splice out current items
  const batch = clickQueue.splice(0, clickQueue.length);

  try {
    const result = await prisma.clickEvent.createMany({
      data: batch,
    });
    return result.count;
  } catch (error) {
    logger.warn(
      { error, batchSize: batch.length },
      'Non-fatal warning: bulk click events persistence failed',
    );
    return 0;
  } finally {
    isFlushing = false;
  }
}

// Background timer to flush buffer every 1,000ms
const flushTimer = setInterval(() => {
  flushClickQueue().catch((err) => {
    logger.debug({ err }, 'Background click flush error');
  });
}, FLUSH_INTERVAL_MS);

// unref timer so it does not keep Node process running on shutdown
if (typeof flushTimer.unref === 'function') {
  flushTimer.unref();
}

/**
 * Dispatches click event persistence asynchronously with micro-batching.
 * Buffers click events in-memory and flushes in bulk every 1000ms or 50 items.
 */
export function dispatchClickEvent(payload: ClickDispatchPayload): void {
  try {
    const sanitizedReferrer = sanitizeReferrer(payload.rawReferrer);
    const sanitizedDevice = classifyDeviceType(payload.userAgent);
    const sanitizedCountry = sanitizeCountryCode(payload.countryCode);

    if (clickQueue.length >= MAX_QUEUE_SIZE) {
      // Drop oldest 100 items if queue fills up to protect heap memory
      clickQueue.splice(0, 100);
    }

    clickQueue.push({
      linkId: payload.linkId,
      clickedAt: new Date(),
      referrer: sanitizedReferrer || null,
      deviceType: sanitizedDevice,
      countryCode: sanitizedCountry || null,
    });

    // If buffer reaches threshold, trigger asynchronous flush immediately
    if (clickQueue.length >= FLUSH_THRESHOLD) {
      setImmediate(() => {
        flushClickQueue().catch(() => {});
      });
    }
  } catch (error) {
    logger.warn({ error, linkId: payload.linkId }, 'Error queueing click event');
  }
}

/**
 * Returns current queue size (useful for monitoring and unit tests).
 */
export function getClickQueueSize(): number {
  return clickQueue.length;
}

/**
 * Clears the queue (useful for test isolation).
 */
export function clearClickQueue(): void {
  clickQueue = [];
}
