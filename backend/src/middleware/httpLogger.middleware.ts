// HTTP Request Logger Middleware
// Logs all HTTP requests with timing and status codes

import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

// Create HTTP logger middleware
export const httpLogger = pinoHttp({
  logger,

  // Custom log level based on response status
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    if (res.statusCode >= 300) {
      return 'silent'; // Don't log redirects
    }
    return 'info';
  },

  // Customize request logging
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      path: req.raw.url,
      // Remove sensitive headers
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        cookie: req.headers.cookie ? '[REDACTED]' : undefined,
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: res.headers,
    }),
  },

  // Custom success message
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },

  // Custom error message
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },

  // Custom attribute keys
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },

  // Auto-logging of request/response
  autoLogging: true,

  // Customize properties added to log
  customProps: (req, res) => {
    return {
      userId: (req as any).user?.id,
      tenantId: (req as any).user?.tenantId,
    };
  },
});
