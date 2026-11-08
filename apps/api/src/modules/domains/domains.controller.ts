import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../database/db';
import { DomainsService } from './domains.service';
import { createDomainSchema, updateDomainSchema } from '@shortener/shared';

export class DomainsController {
  public static async createDomain(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const validatedInput = createDomainSchema.parse(req.body);
      const domain = await DomainsService.createDomain(req.user.id, validatedInput);

      res.status(201).json({
        data: domain,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listDomains(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const domains = await DomainsService.listDomains(req.user.id);

      res.status(200).json({
        data: domains,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getDomain(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const domainId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const domain = await DomainsService.getDomain(req.user.id, domainId);

      res.status(200).json({
        data: domain,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyDomain(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const domainId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await DomainsService.verifyDomain(req.user.id, domainId);

      res.status(200).json({
        data: result.domain,
        meta: {
          verification: result.verification,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateDomain(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const domainId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedInput = updateDomainSchema.parse(req.body);
      const domain = await DomainsService.updateDomain(
        req.user.id,
        domainId,
        validatedInput,
      );

      res.status(200).json({
        data: domain,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteDomain(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const domainId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      await DomainsService.deleteDomain(req.user.id, domainId);

      res.status(200).json({
        data: {
          success: true,
          message: 'Custom domain removed successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Caddy On-Demand TLS Handshake Security Check:
   * Called by Caddy reverse proxy before issuing or renewing an automated Let's Encrypt / ZeroSSL TLS certificate.
   * Responds with 200 OK only if the domain is verified and active on the platform.
   */
  public static async caddyAsk(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const rawDomain = (req.query.domain as string) || '';
      const domain = rawDomain.trim().toLowerCase();

      if (!domain) {
        res.status(400).send('Missing domain parameter');
        return;
      }

      // Allow primary platform hostnames
      const platformDomains = ['urlref.softics.in', 'apiref.softics.in', 'localhost', '127.0.0.1'];
      if (platformDomains.includes(domain)) {
        res.status(200).send('Domain authorized');
        return;
      }

      // Verify active or verified custom domain in PostgreSQL
      const customDomain = await prisma.customDomain.findFirst({
        where: {
          hostname: domain,
          status: { in: ['ACTIVE', 'VERIFIED'] },
        },
        select: { id: true, status: true },
      });

      if (customDomain) {
        res.status(200).send('Domain authorized');
        return;
      }

      // Reject unverified or nonexistent domains to avoid Let's Encrypt rate limit abuse
      res.status(404).send('Domain not authorized for on-demand TLS');
    } catch (error) {
      next(error);
    }
  }
}
