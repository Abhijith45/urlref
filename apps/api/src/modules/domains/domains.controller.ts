import { Request, Response, NextFunction } from 'express';
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
}
