import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService } from './billing.service';
import { prisma } from '../../database/db';
import Stripe from 'stripe';

describe('BillingService (Webhook Idempotency)', () => {
  beforeEach(async () => {
    await prisma.webhookEvent.deleteMany();
  });

  it('should record processed webhook event ID in database', async () => {
    const mockEvent = {
      id: 'evt_test_idempotency_1',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_nonexistent',
        },
      },
    } as unknown as Stripe.Event;

    await BillingService.handleWebhookEvent(mockEvent);

    const record = await prisma.webhookEvent.findUnique({
      where: { id: 'evt_test_idempotency_1' },
    });

    expect(record).toBeDefined();
    expect(record?.id).toBe('evt_test_idempotency_1');
    expect(record?.type).toBe('customer.subscription.deleted');
  });

  it('should safely skip already processed webhook events (P2002 idempotency test)', async () => {
    const mockEvent = {
      id: 'evt_test_idempotency_2',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_nonexistent',
        },
      },
    } as unknown as Stripe.Event;

    // First call processes normally
    await BillingService.handleWebhookEvent(mockEvent);

    // Second call with duplicate event should not throw and should skip idempotently
    await expect(BillingService.handleWebhookEvent(mockEvent)).resolves.not.toThrow();

    const count = await prisma.webhookEvent.count({
      where: { id: 'evt_test_idempotency_2' },
    });
    expect(count).toBe(1);
  });
});
