import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../../database/db';

export class HealthController {
  public static async getLiveness(req: Request, res: Response): Promise<void> {
    // If client requested database pool warm-up on wake-up
    if (req.query.warmup === 'true') {
      try {
        await checkDatabaseConnection();
      } catch {
        // Silently continue so liveness probe remains non-blocking
      }
    }

    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }

  public static async getReadiness(_req: Request, res: Response): Promise<void> {
    const isDbConnected = await checkDatabaseConnection();

    if (isDbConnected) {
      res.status(200).json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
