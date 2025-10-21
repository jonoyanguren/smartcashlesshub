// Logger Configuration with Pino
// Provides structured logging for the application

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Format configuration
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),

  // Base configuration for production (JSON logs)
  ...(!isDevelopment && {
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
  }),

  // Add timestamp to all logs
  timestamp: pino.stdTimeFunctions.isoTime,

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Base context for all logs
  base: {
    env: process.env.NODE_ENV || 'development',
    app: 'smart-cashless-api',
  },
});

// Child logger with context
export function createLogger(context: string) {
  return logger.child({ context });
}

// Helper to log errors with full stack trace
export function logError(error: Error | unknown, context?: string) {
  if (error instanceof Error) {
    logger.error({
      err: error,
      context,
      stack: error.stack,
    }, error.message);
  } else {
    logger.error({ error, context }, 'Unknown error occurred');
  }
}

// Export logger as default
export default logger;
