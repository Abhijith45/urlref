import Stripe from 'stripe';
import { env } from '../../config/env';

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeClient) {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured in environment variables');
    }
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(env.STRIPE_SECRET_KEY);
}
