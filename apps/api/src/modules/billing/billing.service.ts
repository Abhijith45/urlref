import { PlanTier } from '@prisma/client';
import { prisma } from '../../database/db';
import { env } from '../../config/env';
import { getStripeClient, isStripeConfigured } from './stripe.client';
import { BadRequestError, NotFoundError } from '../../errors/app-error';
import { logger } from '../../utils/logger';
import {
  CreateCheckoutSessionInput,
  SubscriptionStatusDto,
  TierLimits,
} from '@shortener/shared';
import Stripe from 'stripe';

export const TIER_LIMITS: Record<PlanTier, TierLimits> = {
  FREE: {
    maxLinksPerMonth: 10,
    maxCustomDomains: 0,
    dynamicQrAllowed: false,
    analyticsRetentionDays: 7,
  },
  PRO: {
    maxLinksPerMonth: 100,
    maxCustomDomains: 1,
    dynamicQrAllowed: true,
    analyticsRetentionDays: 30,
  },
  AGENCY: {
    maxLinksPerMonth: 1000,
    maxCustomDomains: 5,
    dynamicQrAllowed: true,
    analyticsRetentionDays: 365,
  },
};

// Default pricing in INR (paise: 100 paise = 1 INR)
// Pro: ₹199/month or ₹1,999/year (Save 17%)
// Agency: ₹499/month or ₹4,999/year (Save 17%)
export const TIER_PRICES_INR = {
  PRO: {
    month: {
      amount: 19900,
      name: 'URLRef Pro Monthly',
      description: '100 links/month, 100 dynamic editable QRs, 1 custom domain',
    },
    year: {
      amount: 199900,
      name: 'URLRef Pro Annual',
      description: '100 links/month, 100 dynamic editable QRs, 1 custom domain (Save 17%)',
    },
  },
  AGENCY: {
    month: {
      amount: 49900,
      name: 'URLRef Agency Monthly',
      description: '1,000 links/month, unlimited dynamic QRs, 5 custom domains',
    },
    year: {
      amount: 499900,
      name: 'URLRef Agency Annual',
      description: '1,000 links/month, unlimited dynamic QRs, 5 custom domains (Save 17%)',
    },
  },
};

export class BillingService {
  /**
   * Retrieves subscription status, quotas, and current month usage for a user.
   */
  static async getSubscriptionStatus(userId: string): Promise<SubscriptionStatusDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        plan: true,
        subscriptionStatus: true,
        subscriptionPeriodEnd: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Calculate usage in current calendar month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [linksCreatedThisMonth, customDomainsCount] = await Promise.all([
      prisma.link.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.customDomain.count({
        where: { userId },
      }),
    ]);

    const tier = (user.plan || 'FREE') as PlanTier;
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.FREE;

    return {
      tier,
      status: user.subscriptionStatus || 'inactive',
      currentPeriodEnd: user.subscriptionPeriodEnd ? user.subscriptionPeriodEnd.toISOString() : null,
      cancelAtPeriodEnd: false,
      limits,
      usage: {
        linksCreatedThisMonth,
        customDomainsCount,
      },
    };
  }

  /**
   * Creates a Stripe Checkout Session for subscription upgrade.
   */
  static async createCheckoutSession(
    userId: string,
    input: CreateCheckoutSessionInput,
  ): Promise<{ url: string }> {
    if (!isStripeConfigured()) {
      throw new BadRequestError(
        'Stripe payment gateway is not yet configured on the server. Please check STRIPE_SECRET_KEY in environment variables.',
      );
    }

    const stripe = getStripeClient();

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Ensure Stripe customer exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
          clerkId: user.clerkId || '',
        },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Resolve pre-configured price ID or build inline recurring price_data
    let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;

    const configuredPriceId =
      input.tier === 'PRO'
        ? input.interval === 'year'
          ? env.STRIPE_PRO_ANNUAL_PRICE_ID
          : env.STRIPE_PRO_MONTHLY_PRICE_ID
        : input.interval === 'year'
          ? env.STRIPE_AGENCY_ANNUAL_PRICE_ID
          : env.STRIPE_AGENCY_MONTHLY_PRICE_ID;

    if (configuredPriceId) {
      lineItem = {
        price: configuredPriceId,
        quantity: 1,
      };
    } else {
      const priceMeta = TIER_PRICES_INR[input.tier][input.interval];
      lineItem = {
        price_data: {
          currency: 'inr',
          product_data: {
            name: priceMeta.name,
            description: priceMeta.description,
          },
          unit_amount: priceMeta.amount,
          recurring: {
            interval: input.interval,
          },
        },
        quantity: 1,
      };
    }

    const successUrl =
      input.successUrl ||
      `${env.FRONTEND_URL}/dashboard?billing=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = input.cancelUrl || `${env.FRONTEND_URL}/dashboard?billing=cancel`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [lineItem],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        targetTier: input.tier,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          targetTier: input.tier,
        },
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new BadRequestError('Failed to generate Stripe checkout session URL');
    }

    return { url: session.url };
  }

  /**
   * Creates a Stripe Customer Portal Session for managing subscriptions, payment methods, and invoices.
   */
  static async createCustomerPortalSession(userId: string): Promise<{ url: string }> {
    if (!isStripeConfigured()) {
      throw new BadRequestError('Stripe payment gateway is not yet configured');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user || !user.stripeCustomerId) {
      throw new BadRequestError('No active billing customer found. Upgrade to a plan first.');
    }

    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${env.FRONTEND_URL}/dashboard`,
    });

    return { url: portalSession.url };
  }

  /**
   * Processes verified incoming Stripe Webhook events to keep user plan and subscription status in sync.
   */
  static async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    // 1. Enforce Webhook Idempotency: Reject duplicate/replayed events
    try {
      await prisma.webhookEvent.create({
        data: {
          id: event.id,
          type: event.type,
        },
      });
    } catch (error: unknown) {
      const prismaErr = error as { code?: string };
      if (prismaErr.code === 'P2002') {
        logger.info(
          { eventId: event.id, type: event.type },
          'Webhook event already processed (idempotent skip)',
        );
        return;
      }
      throw error;
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          const customerId =
            typeof session.customer === 'string' ? session.customer : session.customer?.id;
          const userId = session.metadata?.userId;
          const targetTier = (session.metadata?.targetTier as PlanTier) || 'PRO';

          const stripe = getStripeClient();
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = (subscription as any).current_period_end
            ? new Date((subscription as any).current_period_end * 1000)
            : null;

          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                plan: targetTier,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: subscription.status,
                subscriptionPeriodEnd: periodEnd,
              },
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const periodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000)
          : null;

        const targetTier = (subscription.metadata?.targetTier as PlanTier) || undefined;

        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionStatus: subscription.status,
            subscriptionPeriodEnd: periodEnd,
            ...(targetTier ? { plan: targetTier } : {}),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.user.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan: 'FREE',
            subscriptionStatus: 'canceled',
            stripeSubscriptionId: null,
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;
        if (subscriptionId && typeof subscriptionId === 'string') {
          await prisma.user.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: { subscriptionStatus: 'past_due' },
          });
        }
        break;
      }

      default:
        // Other events ignored safely
        break;
    }
  }
}
