import { Router } from 'express';
import { BillingController } from './billing.controller';
import { requireAuth } from '../../middleware/auth.middleware';

export const billingRouter = Router();

// Webhook endpoint (Raw body handled in app.ts)
billingRouter.post('/webhook', BillingController.handleWebhook);

// Authenticated user billing endpoints
billingRouter.get('/subscription', requireAuth, BillingController.getSubscription);
billingRouter.post('/checkout', requireAuth, BillingController.createCheckout);
billingRouter.post('/portal', requireAuth, BillingController.createPortal);
