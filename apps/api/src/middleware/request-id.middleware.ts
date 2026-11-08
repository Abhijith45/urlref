import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingId = req.headers['x-request-id'];
  const requestId =
    typeof existingId === 'string' && existingId.trim().length > 0
      ? existingId.trim()
      : `req_${crypto.randomUUID()}`;

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
