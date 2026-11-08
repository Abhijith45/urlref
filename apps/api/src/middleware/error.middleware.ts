import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';
import { ERROR_CODES } from '@shortener/shared';
import { logger } from '../utils/logger';
import { sentry } from '../utils/sentry';

export function errorHandlerMiddleware(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.id || 'unknown';

  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    res.status(400).json({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Invalid request input',
        details,
        requestId,
      },
    });
    return;
  }

  // Handle Operational Domain Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details,
        requestId,
      },
    });
    return;
  }

  // Handle Prisma Known Request Errors
  const prismaError = err as unknown as { code?: string; meta?: Record<string, unknown> };
  if (prismaError.code === 'P2002') {
    const target = Array.isArray(prismaError.meta?.target)
      ? prismaError.meta?.target.join(', ')
      : 'field';
    res.status(409).json({
      error: {
        code: ERROR_CODES.CODE_CONFLICT,
        message: `A conflict occurred with unique constraint on ${target}`,
        requestId,
      },
    });
    return;
  }

  if (prismaError.code === 'P2025') {
    res.status(404).json({
      error: {
        code: ERROR_CODES.LINK_NOT_FOUND,
        message: 'The requested record could not be found',
        requestId,
      },
    });
    return;
  }

  // Unhandled internal server errors
  logger.error({ err, requestId, path: req.path, method: req.method }, 'Unhandled internal error');
  sentry.captureException(err, { requestId, path: req.path, method: req.method });

  res.status(500).json({
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message:
        process.env.NODE_ENV === 'production'
          ? 'An internal error occurred. Please try again later.'
          : err.message || 'Internal server error',
      requestId,
    },
  });
}
