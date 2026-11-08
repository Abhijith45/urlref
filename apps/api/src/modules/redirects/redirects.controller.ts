import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';
import { dispatchClickEvent } from './click-dispatcher';

export class RedirectController {
  public static async handleRedirect(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const code = typeof req.params.code === 'string' ? req.params.code : '';

    try {
      // Validate code character set
      if (!code || !/^[a-zA-Z0-9_-]+$/.test(code) || code.length > 32) {
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

      const isPlatformHost =
        requestHost === 'localhost' ||
        requestHost === '127.0.0.1' ||
        requestHost === 'apiref.softics.in' ||
        requestHost === 'urlref.softics.in';

      let customDomain: { id: string; custom404Url: string | null } | null = null;
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
      let link: {
        id: string;
        destinationUrl: string;
        isActive: boolean;
        expiresAt: Date | null;
      } | null = null;

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

      if (!link) {
        if (customDomain && customDomain.custom404Url) {
          res.redirect(302, customDomain.custom404Url);
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
