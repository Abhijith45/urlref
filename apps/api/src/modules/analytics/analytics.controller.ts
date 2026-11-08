import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';
import { analyticsQuerySchema, linkIdParamSchema } from '@shortener/shared';

export class AnalyticsController {
  public static async getLinkAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: linkId } = linkIdParamSchema.parse(req.params);
      const { from, to } = analyticsQuerySchema.parse(req.query);

      const analytics = await AnalyticsService.getLinkAnalytics(req.user!.id, linkId, from, to);

      res.status(200).json({
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getDashboardOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = analyticsQuerySchema.parse(req.query);

      const overview = await AnalyticsService.getDashboardOverview(req.user!.id, from, to);

      res.status(200).json({
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async exportDashboardCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename, csv } = await AnalyticsService.exportAnalyticsCsv(req.user!.id);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  public static async exportLinkCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: linkId } = linkIdParamSchema.parse(req.params);
      const { filename, csv } = await AnalyticsService.exportAnalyticsCsv(req.user!.id, linkId);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }
}
