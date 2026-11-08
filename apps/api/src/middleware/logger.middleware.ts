import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Exclude health checks from spamming logs
  if (req.path === '/health' || req.path === '/ready') {
    return next();
  }

  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number((endTime - startTime) / 1000000n);

    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userId: (req as unknown as { user?: { id: string } }).user?.id,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'HTTP Request Error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP Request Client Warning');
    } else {
      logger.info(logData, 'HTTP Request Completed');
    }
  });

  next();
}
