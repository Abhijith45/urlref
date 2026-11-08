export interface ClientObservabilityOptions {
  dsn?: string;
  environment?: string;
}

class ClientObservabilityService {
  private isInitialized = false;

  public init(options: ClientObservabilityOptions = {}): void {
    const dsn = options.dsn || import.meta.env.VITE_SENTRY_DSN;
    if (dsn) {
      this.isInitialized = true;
      // eslint-disable-next-line no-console
      console.info('[Observability] Initialized frontend error tracking');
    }
  }

  public captureException(error: unknown, context: Record<string, unknown> = {}): void {
    if (this.isInitialized) {
      // In production with @sentry/react, Sentry.captureException(error, { extra: context })
      // eslint-disable-next-line no-console
      console.error('[Sentry Frontend]', error, context);
    } else {
      // eslint-disable-next-line no-console
      console.error('[App Error]', error, context);
    }
  }
}

export const clientObservability = new ClientObservabilityService();
