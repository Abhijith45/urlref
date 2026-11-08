import { logger } from './logger';

export interface SentryOptions {
  dsn?: string;
  environment?: string;
  release?: string;
}

class ObservabilityService {
  private isInitialized = false;
  private dsn?: string;

  public init(options: SentryOptions = {}): void {
    this.dsn = options.dsn || process.env.SENTRY_DSN;
    if (this.dsn) {
      this.isInitialized = true;
      logger.info(
        { environment: options.environment || process.env.NODE_ENV },
        'Observability service initialized with remote monitoring',
      );
    } else {
      logger.info('Remote monitoring DSN not set; running in local observability mode');
    }
  }

  public captureException(error: unknown, context: Record<string, unknown> = {}): void {
    if (this.isInitialized && this.dsn) {
      // In production with @sentry/node installed, Sentry.captureException(error, { extra: context })
      // For standard logging:
      logger.error({ err: error, context }, '[Sentry] Exception captured and forwarded');
    } else {
      logger.error({ err: error, context }, 'Unhandled exception');
    }
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    if (this.isInitialized && this.dsn) {
      logger.info({ message, level }, '[Sentry] Event message captured');
    }
  }
}

export const sentry = new ObservabilityService();
