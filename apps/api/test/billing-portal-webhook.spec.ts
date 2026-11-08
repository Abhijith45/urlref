import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/database/db';
import { SessionService, SESSION_COOKIE_NAME } from '../src/modules/auth/session.service';
import { BillingService } from '../src/modules/billing/billing.service';

const app = createApp();

describe('Stripe Billing Lifecycle, Portal & Webhooks (Integration)', () => {
  const billingUserId = 'b0000000-0000-4000-8000-000000000099';
  let authCookie: string;

  beforeEach(async () => {
    await prisma.webhookEvent.deleteMany();
    await prisma.user.deleteMany({
      where: { id: billingUserId },
    });

    await prisma.user.create({
      data: {
        id: billingUserId,
        email: 'billing-lifecycle@example.com',
        role: 'USER',
        plan: 'PRO',
        stripeCustomerId: 'cus_test_portal_12345',
        stripeSubscriptionId: 'sub_test_lifecycle_12345',
        subscriptionStatus: 'active',
      },
    });

    authCookie = `${SESSION_COOKIE_NAME}=${SessionService.createSessionToken(billingUserId, 'USER')}`;
  });

  it('GET /api/v1/billing/invoices should return invoices array for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/billing/invoices')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('handleWebhookEvent should process customer.subscription.updated and upgrade plan', async () => {
    const event = {
      id: 'evt_test_sub_upgrade_1',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_lifecycle_12345',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
          metadata: {
            targetTier: 'AGENCY',
          },
        },
      },
    } as any;

    await BillingService.handleWebhookEvent(event);

    const user = await prisma.user.findUnique({
      where: { id: billingUserId },
    });

    expect(user?.plan).toBe('AGENCY');
    expect(user?.subscriptionStatus).toBe('active');
  });

  it('handleWebhookEvent should process invoice.paid and record active status', async () => {
    const event = {
      id: 'evt_test_inv_paid_1',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_test_paid_12345',
          subscription: 'sub_test_lifecycle_12345',
        },
      },
    } as any;

    await BillingService.handleWebhookEvent(event);

    const user = await prisma.user.findUnique({
      where: { id: billingUserId },
    });

    expect(user?.subscriptionStatus).toBe('active');
  });

  it('handleWebhookEvent should process customer.subscription.deleted and revert to FREE tier', async () => {
    const event = {
      id: 'evt_test_sub_deleted_1',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_test_lifecycle_12345',
        },
      },
    } as any;

    await BillingService.handleWebhookEvent(event);

    const user = await prisma.user.findUnique({
      where: { id: billingUserId },
    });

    expect(user?.plan).toBe('FREE');
    expect(user?.subscriptionStatus).toBe('canceled');
  });
});
