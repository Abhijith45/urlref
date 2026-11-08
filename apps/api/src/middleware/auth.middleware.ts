import { Request, Response, NextFunction } from 'express';
import { getAuth, clerkClient } from '@clerk/express';
import { prisma } from '../database/db';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { SESSION_COOKIE_NAME, SessionService } from '../modules/auth/session.service';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error';

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: string;
      };
    }
  }
}

/**
 * Production-hardened authentication middleware supporting Clerk JWTs (Bearer)
 * with transparent local database user provisioning and dual-mode test fallback.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Clerk Authentication Check (Primary)
    if (env.CLERK_SECRET_KEY) {
      let auth: { userId: string | null } | null = null;
      try {
        auth = getAuth(req);
      } catch {
        // req not processed by clerkMiddleware or non-clerk request
      }

      if (auth && auth.userId) {
        const clerkUserId = auth.userId;

        // Fast indexed lookup for local UUID
        let user = await prisma.user.findUnique({
          where: { clerkId: clerkUserId },
        });

        if (!user) {
          // First API request for this Clerk user: sync profile from Clerk
          try {
            const clerkUser = await clerkClient.users.getUser(clerkUserId);
            const primaryEmail =
              clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
              clerkUser.emailAddresses[0]?.emailAddress ||
              `${clerkUserId}@clerk.user`;

            const normalizedEmail = primaryEmail.toLowerCase().trim();

            // Link existing user or create a new PostgreSQL record
            const existingEmailUser = await prisma.user.findUnique({
              where: { email: normalizedEmail },
            });

            if (existingEmailUser) {
              user = await prisma.user.update({
                where: { id: existingEmailUser.id },
                data: { clerkId: clerkUserId },
              });
            } else {
              user = await prisma.user.create({
                data: {
                  clerkId: clerkUserId,
                  email: normalizedEmail,
                  role: 'USER',
                },
              });
            }
          } catch (syncError) {
            logger.error({ syncError, clerkUserId }, 'Failed to provision local user from Clerk');
            throw new UnauthorizedError('Unable to authenticate user session');
          }
        }

        req.user = {
          id: user.id,
          role: user.role,
        };

        return next();
      }
    }

    // 2. Legacy / Integration Test HMAC Session Cookie Fallback
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (token) {
      const payload = SessionService.verifySessionToken(token);
      if (payload) {
        req.user = {
          id: payload.userId,
          role: payload.role,
        };
        return next();
      }
    }

    throw new UnauthorizedError('Authentication session required');
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware requiring a specific role (e.g. 'ADMIN').
 */
export function requireRole(requiredRole: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== requiredRole) {
      throw new ForbiddenError('Insufficient permissions for this resource');
    }
    next();
  };
}
