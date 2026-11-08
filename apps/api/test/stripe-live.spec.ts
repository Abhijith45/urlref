import { describe, it, expect } from 'vitest';
import { BillingService } from '../src/modules/billing/billing.service';
import { prisma } from '../src/database/db';

describe('Live Stripe Checkout Session Generation', () => {
  it('should generate a valid Stripe checkout URL with real Stripe keys', async () => {
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('mock')) {
      console.log('Skipping live Stripe test: mock or missing STRIPE_SECRET_KEY');
      return;
    }

    // Find or create a test user in DB
    let user = await prisma.user.findFirst({
      where: { email: { contains: 'billing-live-test' } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `billing-live-test-${Date.now()}@example.com`,
          role: 'USER',
        },
      });
    }

    const session = await BillingService.createCheckoutSession(user.id, {
      tier: 'PRO',
      interval: 'month',
    });

    expect(session.url).toBeDefined();
    expect(session.url).toContain('stripe.com');
    console.log('\n[SUCCESS] Generated live Stripe Checkout URL:', session.url);
  });
});
