import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { disconnectDatabase } from './database/db';

const app = createApp();
const server = http.createServer(app);

let isShuttingDown = false;

function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'Graceful shutdown initiated. Closing HTTP server...');

  // Hard deadline timeout of 10s to force process exit if connections hang
  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timeout exceeded (10s). Forcing process exit.');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error during HTTP server close');
      process.exit(1);
    }

    logger.info('HTTP server closed. Disconnecting database pools...');
    try {
      await disconnectDatabase();
      logger.info('Database disconnected cleanly. Exiting process.');
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (dbErr) {
      logger.error({ err: dbErr }, 'Error during database disconnection');
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  });
}

// Graceful signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Top-level error catchers
process.on('uncaughtException', (error: Error) => {
  logger.fatal({ err: error }, 'Uncaught exception detected! Initiating emergency shutdown.');
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ reason }, 'Unhandled promise rejection detected! Initiating emergency shutdown.');
  gracefulShutdown('unhandledRejection');
});

// Start listening
server.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      appUrl: env.APP_BASE_URL,
      frontendUrl: env.FRONTEND_URL,
    },
    `Shortener API service successfully listening on port ${env.PORT}`,
  );
});

export { server, app };
