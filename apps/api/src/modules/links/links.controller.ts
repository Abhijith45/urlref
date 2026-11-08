import { Request, Response, NextFunction } from 'express';
import { LinksService } from './links.service';
import {
  createLinkSchema,
  destinationUrlSchema,
  linkIdParamSchema,
  paginationQuerySchema,
  updateLinkSchema,
} from '@shortener/shared';
import { z } from 'zod';

export class LinksController {
  /**
   * Public unauthenticated short link creation (strictly 1 per IP).
   */
  public static async createAnonymousLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { destinationUrl } = z.object({ destinationUrl: destinationUrlSchema }).parse(req.body);
      const ip = (req.ip || req.socket.remoteAddress || '127.0.0.1').replace(/^.*:/, '');

      const link = await LinksService.createAnonymousLink(ip, destinationUrl);

      res.status(201).json({
        data: link,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Claims temporary anonymous links into the authenticated user's account.
   */
  public static async claimLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { linkIds } = z.object({ linkIds: z.array(z.string()) }).parse(req.body);
      const result = await LinksService.claimAnonymousLinks(req.user.id, linkIds);

      res.status(200).json({
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieves user's monthly quota metrics (e.g. used 3 of 10).
   */
  public static async getUserQuota(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quota = await LinksService.getUserQuota(req.user.id);
      res.status(200).json({
        data: quota,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedInput = createLinkSchema.parse(req.body);
      const userId = req.user.id;
      const link = await LinksService.createLink(userId, validatedInput);

      res.status(201).json({
        data: link,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async listLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedQuery = paginationQuerySchema.parse(req.query);
      const userId = req.user.id;
      const result = await LinksService.listUserLinks(userId, validatedQuery);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = linkIdParamSchema.parse(req.params);
      const userId = req.user.id;
      const link = await LinksService.getLinkById(userId, id);

      res.status(200).json({
        data: link,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = linkIdParamSchema.parse(req.params);
      const validatedInput = updateLinkSchema.parse(req.body);
      const userId = req.user.id;
      const updated = await LinksService.updateLink(userId, id, validatedInput);

      res.status(200).json({
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = linkIdParamSchema.parse(req.params);
      const userId = req.user.id;
      await LinksService.deleteLink(userId, id);

      res.status(200).json({
        data: { success: true },
      });
    } catch (error) {
      next(error);
    }
  }
}
