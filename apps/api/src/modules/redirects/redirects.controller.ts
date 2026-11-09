import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';
import { dispatchClickEvent } from './click-dispatcher';
import { redirectCache, CachedRedirectLink } from './redirect-cache';
import { env } from '../../config/env';

export class RedirectController {
  public static async handleRedirect(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const code = typeof req.params.code === 'string' ? req.params.code : '';

    try {
      // Prevent search engine crawlers from indexing vanity or ephemeral short links
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');

      // Helper to check if client explicitly requests HTML (e.g. human browser navigating directly)
      const acceptHeader = req.headers.accept || '';
      const isExplicitBrowserNavigation =
        typeof acceptHeader === 'string' &&
        acceptHeader.includes('text/html') &&
        !acceptHeader.includes('application/json');

      // Validate code character set
      if (!code || !/^[a-zA-Z0-9_-]+$/.test(code) || code.length > 32) {
        if (isExplicitBrowserNavigation) {
          res.status(302);
          res.setHeader('Location', `${env.FRONTEND_URL}/link-not-found?code=${encodeURIComponent(code)}`);
          res.end();
          return;
        }

        res.status(404).json({
          error: {
            code: 'LINK_NOT_FOUND',
            message: 'Invalid or nonexistent short code',
            requestId: req.id,
          },
        });
        return;
      }

      // Host-Aware Resolution: Check if request arrives via a custom domain
      const hostHeader = (req.headers['x-forwarded-host'] as string) || req.hostname || '';
      const requestHost = hostHeader.split(':')[0].toLowerCase();

      // Check In-Memory LRU Cache first for sub-millisecond execution (< 1ms, 0 DB queries)
      const cached = redirectCache.get(requestHost, code);
      if (cached === null) {
        // Negative cache hit (verified 404 in LRU memory within 15s)
        if (isExplicitBrowserNavigation) {
          res.status(302);
          res.setHeader('Location', `${env.FRONTEND_URL}/link-not-found?code=${encodeURIComponent(code)}`);
          res.end();
          return;
        }

        res.status(404).json({
          error: {
            code: 'LINK_NOT_FOUND',
            message: 'Short link not found',
            requestId: req.id,
          },
        });
        return;
      }

      let link: CachedRedirectLink | null = cached || null;
      let customDomain: { id: string; custom404Url: string | null } | null = null;

      if (!link) {
        const isPlatformHost =
          requestHost === 'localhost' ||
          requestHost === '127.0.0.1' ||
          requestHost === 'apiref.softics.in' ||
          requestHost === 'urlref.softics.in';

        if (!isPlatformHost) {
          customDomain = await prisma.customDomain.findFirst({
            where: {
              hostname: requestHost,
              status: { in: ['ACTIVE', 'VERIFIED'] },
            },
            select: { id: true, custom404Url: true },
          });
        }

        // Fast, indexed database query
        if (customDomain) {
          link = await prisma.link.findFirst({
            where: {
              code,
              customDomainId: customDomain.id,
            },
            select: {
              id: true,
              destinationUrl: true,
              isActive: true,
              expiresAt: true,
            },
          });
        } else {
          link = await prisma.link.findUnique({
            where: { code },
            select: {
              id: true,
              destinationUrl: true,
              isActive: true,
              expiresAt: true,
            },
          });
        }

        // Populate in-memory LRU cache on positive match or negative miss
        if (link) {
          redirectCache.set(requestHost, code, {
            id: link.id,
            destinationUrl: link.destinationUrl,
            isActive: link.isActive,
            expiresAt: link.expiresAt,
            custom404Url: customDomain?.custom404Url,
          });
        } else if (!customDomain?.custom404Url) {
          // Negative cache 404 for 15s to absorb brute force and scraping scans
          redirectCache.setNotFound(requestHost, code, 15000);
        }
      }

      const fallback404 = customDomain?.custom404Url || cached?.custom404Url;

      if (!link) {
        if (fallback404) {
          res.status(302);
          res.setHeader('Location', fallback404);
          res.end();
          return;
        }

        if (isExplicitBrowserNavigation) {
          res.status(302);
          res.setHeader('Location', `${env.FRONTEND_URL}/link-not-found?code=${encodeURIComponent(code)}`);
          res.end();
          return;
        }

        res.status(404).json({
          error: {
            code: 'LINK_NOT_FOUND',
            message: 'Short link not found',
            requestId: req.id,
          },
        });
        return;
      }

      if (!link.isActive) {
        if (fallback404) {
          res.status(302);
          res.setHeader('Location', fallback404);
          res.end();
          return;
        }

        if (isExplicitBrowserNavigation) {
          res.status(302);
          res.setHeader('Location', `${env.FRONTEND_URL}/link-expired?reason=disabled&code=${encodeURIComponent(code)}`);
          res.end();
          return;
        }

        res.status(410).json({
          error: {
            code: 'LINK_INACTIVE',
            message: 'This short link has been disabled by its owner',
            requestId: req.id,
          },
        });
        return;
      }

      if (link.expiresAt && new Date() >= link.expiresAt) {
        if (fallback404) {
          res.status(302);
          res.setHeader('Location', fallback404);
          res.end();
          return;
        }

        if (isExplicitBrowserNavigation) {
          res.status(302);
          res.setHeader('Location', `${env.FRONTEND_URL}/link-expired?reason=expired&code=${encodeURIComponent(code)}`);
          res.end();
          return;
        }

        res.status(410).json({
          error: {
            code: 'LINK_EXPIRED',
            message: 'This short link has expired',
            requestId: req.id,
          },
        });
        return;
      }

      // Set HTTP 302 Found & disable permanent client caching
      res.set({
        Location: link.destinationUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        'X-Robots-Tag': 'noindex, nofollow',
      });
      res.status(302).end();

      // Fire-and-forget asynchronous click tracking
      const rawReferrer =
        (req.headers.referer as string) || (req.headers.referrer as string) || undefined;
      const userAgent = req.headers['user-agent'];
      const countryCode =
        (req.headers['cf-ipcountry'] as string) ||
        (req.headers['x-country-code'] as string) ||
        undefined;

      dispatchClickEvent({
        linkId: link.id,
        rawReferrer,
        userAgent,
        countryCode,
      });
    } catch (error) {
      next(error);
    }
  }
}
