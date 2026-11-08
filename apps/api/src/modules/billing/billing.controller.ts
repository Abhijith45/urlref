import { Request, Response, NextFunction } from 'express';
import { BillingService } from './billing.service';
import { createCheckoutSessionSchema } from '@shortener/shared';
import { BadRequestError } from '../../errors/app-error';
import { getStripeClient } from './stripe.client';
import { env } from '../../config/env';

export class BillingController {
  static async getSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User authentication required');
      }

      const status = await BillingService.getSubscriptionStatus(userId);
      res.status(200).json({ data: status });
    } catch (err) {
      next(err);
    }
  }

  static async createCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User authentication required');
      }

      const parsed = createCheckoutSessionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid checkout parameters',
            details: parsed.error.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
            })),
            requestId: req.id,
          },
        });
        return;
      }

      const result = await BillingService.createCheckoutSession(userId, parsed.data);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  static async createPortal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User authentication required');
      }

      const result = await BillingService.createCustomerPortalSession(userId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  }

  static async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new BadRequestError('User authentication required');
      }

      const invoices = await BillingService.listInvoices(userId);
      res.status(200).json({ data: invoices });
    } catch (err) {
      next(err);
    }
  }

  static async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        res.status(400).send('Missing stripe-signature header');
        return;
      }

      if (!env.STRIPE_WEBHOOK_SECRET) {
        res.status(500).send('STRIPE_WEBHOOK_SECRET is not configured on the server');
        return;
      }

      const stripe = getStripeClient();
      let event;
      try {
        // req.body must be raw Buffer when passed through express.raw()
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (err: any) {
        res.status(400).send(`Webhook signature verification failed: ${err.message}`);
        return;
      }

      await BillingService.handleWebhookEvent(event);
      res.status(200).json({ received: true });
    } catch (err) {
      next(err);
    }
  }
}
