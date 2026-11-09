import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { clerkMiddleware } from '@clerk/express';
import { env } from './config/env';
import { logger } from './utils/logger';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { requestLoggerMiddleware } from './middleware/logger.middleware';
import { errorHandlerMiddleware } from './middleware/error.middleware';
import healthRouter from './modules/health/health.routes';
import { HealthController } from './modules/health/health.controller';
import authRouter from './modules/auth/auth.routes';
import linksRouter from './modules/links/links.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { billingRouter } from './modules/billing/billing.routes';
import domainsRouter from './modules/domains/domains.routes';
import workspacesRouter from './modules/workspaces/workspaces.routes';
import redirectsRouter from './modules/redirects/redirects.routes';
import { NotFoundError } from './errors/app-error';

export function createApp(): Express {
  const app = express();

  // Trust proxy for reverse proxies / Cloudflare / Render
  app.set('trust proxy', 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Handled separately or by frontend
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS configuration for subdomain sharing
  const allowedOrigins = [
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'https://urlref.softics.in',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, redirects)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    }),
  );

  // Stripe Webhook requires raw Buffer body for HMAC signature verification
  app.use('/api/v1/billing/webhook', express.raw({ type: 'application/json' }));

  // Parsers & IDs
  app.use(cookieParser());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);

  // Clerk Authentication Middleware (verifies RS256 JWTs)
  if (
    env.CLERK_SECRET_KEY &&
    !env.CLERK_SECRET_KEY.includes('mock') &&
    env.CLERK_PUBLISHABLE_KEY &&
    !env.CLERK_PUBLISHABLE_KEY.includes('mock')
  ) {
    try {
      const clerkHandler = clerkMiddleware({
        publishableKey: env.CLERK_PUBLISHABLE_KEY,
        secretKey: env.CLERK_SECRET_KEY,
      });
      app.use((req: Request, res: Response, next: NextFunction) => {
        // Skip Clerk browser handshake for public redirects and health probes
        if (!req.path.startsWith('/api/')) {
          return next();
        }
        try {
          return clerkHandler(req, res, next);
        } catch (clerkErr) {
          logger.warn({ clerkErr }, 'Clerk middleware execution error; bypassing');
          return next();
        }
      });
    } catch (clerkInitErr) {
      logger.warn({ clerkInitErr }, 'Clerk initialization failed; skipping Clerk middleware');
    }
  }

  // CSRF Defense: Reject cross-site and unauthorized origin mutations
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Exempt external Stripe webhooks from browser CSRF defense
    if (req.path === '/api/v1/billing/webhook') {
      return next();
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const origin = req.headers.origin;
      const secFetchSite = req.headers['sec-fetch-site'];

      if (secFetchSite === 'cross-site' && (!origin || !allowedOrigins.includes(origin))) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Cross-site request forgery defense: request blocked',
            requestId: req.id,
          },
        });
        return;
      }

      if (origin && !allowedOrigins.includes(origin)) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Origin not allowed for state-changing requests',
            requestId: req.id,
          },
        });
        return;
      }
    }
    next();
  });

  // Health & Readiness probes (accessible at /health, /ready, and /api/v1/health)
  app.use('/health', healthRouter);
  app.use('/api/v1/health', healthRouter);
  app.get('/ready', HealthController.getReadiness);
  app.get('/', HealthController.getLiveness);

  // API v1 Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/links', linksRouter);
  app.use('/api/v1/analytics', analyticsRouter);
  app.use('/api/v1/billing', billingRouter);
  app.use('/api/v1/domains', domainsRouter);
  app.use('/api/v1/workspaces', workspacesRouter);

  // Public Redirect Handler (Stateless Base62 fast lookup)
  app.use('/', redirectsRouter);

  // 404 Fallback
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Global Error Boundary
  app.use(errorHandlerMiddleware);

  return app;
}
