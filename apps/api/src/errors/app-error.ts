import { ERROR_CODES, ErrorCode, ValidationErrorDetail } from '@shortener/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode | string;
  public readonly details?: ValidationErrorDetail[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    errorCode: ErrorCode | string = ERROR_CODES.INTERNAL_ERROR,
    details?: ValidationErrorDetail[],
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request payload', details?: ValidationErrorDetail[]) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errorCode: ErrorCode | string = ERROR_CODES.VALIDATION_ERROR) {
    super(message, 400, errorCode);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, ERROR_CODES.UNAUTHENTICATED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, ERROR_CODES.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', errorCode: ErrorCode = ERROR_CODES.LINK_NOT_FOUND) {
    super(message, 404, errorCode);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', errorCode: ErrorCode = ERROR_CODES.CODE_CONFLICT) {
    super(message, 409, errorCode);
  }
}

export class GoneError extends AppError {
  constructor(message = 'Resource is no longer available', errorCode: ErrorCode = ERROR_CODES.LINK_EXPIRED_OR_INACTIVE) {
    super(message, 410, errorCode);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests, please try again later') {
    super(message, 429, ERROR_CODES.RATE_LIMITED);
  }
}
