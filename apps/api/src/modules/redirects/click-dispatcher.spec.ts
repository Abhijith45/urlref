import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  dispatchClickEvent,
  flushClickQueue,
  getClickQueueSize,
  clearClickQueue,
} from './click-dispatcher';
import { prisma } from '../../database/db';

vi.mock('../../database/db', () => ({
  prisma: {
    clickEvent: {
      createMany: vi.fn(),
    },
  },
}));

describe('ClickDispatcher (Micro-Batching Engine)', () => {
  beforeEach(() => {
    clearClickQueue();
    vi.clearAllMocks();
  });

  it('should buffer click events in memory', () => {
    dispatchClickEvent({
      linkId: 'link_1',
      rawReferrer: 'https://twitter.com/post/123',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      countryCode: 'in',
    });

    expect(getClickQueueSize()).toBe(1);

    dispatchClickEvent({
      linkId: 'link_2',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    });

    expect(getClickQueueSize()).toBe(2);
  });

  it('should flush buffered events in a single createMany bulk insert', async () => {
    vi.mocked(prisma.clickEvent.createMany).mockResolvedValueOnce({ count: 2 });

    dispatchClickEvent({
      linkId: 'link_1',
      rawReferrer: 'https://linkedin.com/feed',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      countryCode: 'US',
    });

    dispatchClickEvent({
      linkId: 'link_2',
      countryCode: 'GB',
    });

    const flushedCount = await flushClickQueue();

    expect(flushedCount).toBe(2);
    expect(getClickQueueSize()).toBe(0);
    expect(prisma.clickEvent.createMany).toHaveBeenCalledTimes(1);

    const callArg = vi.mocked(prisma.clickEvent.createMany).mock.calls[0][0];
    expect(callArg.data).toHaveLength(2);
    expect(callArg.data[0].referrer).toBe('linkedin.com');
    expect(callArg.data[0].deviceType).toBe('desktop');
    expect(callArg.data[0].countryCode).toBe('US');
    expect(callArg.data[1].countryCode).toBe('GB');
  });

  it('should return 0 when flushing an empty queue', async () => {
    const flushedCount = await flushClickQueue();
    expect(flushedCount).toBe(0);
    expect(prisma.clickEvent.createMany).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully without throwing', async () => {
    vi.mocked(prisma.clickEvent.createMany).mockRejectedValueOnce(new Error('Connection failure'));

    dispatchClickEvent({ linkId: 'link_err' });

    const flushedCount = await flushClickQueue();
    expect(flushedCount).toBe(0);
    expect(getClickQueueSize()).toBe(0); // Queue was drained
  });
});
