# Logging System Documentation

## Overview

This API uses **Pino** as its logging infrastructure, replacing Morgan. Pino is a fast, low-overhead Node.js logger that outputs structured JSON logs.

## Features

- ✅ **Fast performance** - Minimal overhead on production
- ✅ **Structured JSON logs** - Easy to parse and analyze
- ✅ **Pretty printing** in development with colors
- ✅ **HTTP request logging** with automatic timing
- ✅ **Error tracking** with full stack traces
- ✅ **Context-aware logging** (userId, tenantId, etc.)
- ✅ **Configurable log levels** (debug, info, warn, error, fatal)

## Configuration

### Environment Variables

```bash
# Set log level (default: info in production, debug in development)
LOG_LEVEL=debug|info|warn|error|fatal

# Environment
NODE_ENV=development|production
```

### Log Levels

- `debug` - Detailed information for debugging
- `info` - General informational messages
- `warn` - Warning messages (4xx errors)
- `error` - Error messages (5xx errors)
- `fatal` - Critical errors that crash the application

## Usage

### 1. Import the Logger

```typescript
import { logger, createLogger } from './utils/logger';

// Create a logger with context
const logger = createLogger('MyController');
```

### 2. Basic Logging

```typescript
// Info logs
logger.info('User logged in successfully');

// With additional context
logger.info({ userId: '123', email: 'user@example.com' }, 'User logged in');

// Warning
logger.warn({ statusCode: 404 }, 'Resource not found');

// Error
logger.error({ err: error }, 'Failed to process payment');

// Fatal (will crash the app)
logger.fatal({ err: error }, 'Database connection lost');
```

### 3. Logging in Controllers

```typescript
import { createLogger } from '../utils/logger';

const logger = createLogger('PackageController');

export async function createPackage(req: Request, res: Response) {
  try {
    logger.info({ packageName: req.body.name }, 'Creating package');

    // ... your code ...

    logger.info({ packageId: pkg.id }, 'Package created successfully');

    res.json({ success: true, data: pkg });
  } catch (error: any) {
    logger.error({ err: error, data: req.body }, 'Error creating package');
    sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR, error);
  }
}
```

### 4. HTTP Request Logging

HTTP requests are automatically logged with:
- HTTP method and URL
- Status code
- Response time (duration)
- User ID and Tenant ID (if authenticated)
- Remote IP address

Example output:
```json
{
  "level": "info",
  "time": "2025-10-21T10:30:15.123Z",
  "request": {
    "method": "POST",
    "url": "/api/v1/packages",
    "remoteAddress": "::1"
  },
  "response": {
    "statusCode": 201
  },
  "duration": 45,
  "userId": "user123",
  "tenantId": "tenant456",
  "msg": "POST /api/v1/packages 201 - Created"
}
```

### 5. Error Logging

Errors are automatically logged by the error response utilities:

```typescript
// 4xx errors → logged as warnings
sendBadRequest(res, ErrorCodes.PACKAGE_NAME_REQUIRED);

// 5xx errors → logged as errors
sendInternalError(res, ErrorCodes.INTERNAL_SERVER_ERROR);
```

## Output Formats

### Development (Pretty Printed)

```
[10:30:15.123] INFO (PackageController): Creating package
    packageName: "Premium VIP Package"

[10:30:15.168] INFO (PackageController): Package created successfully
    packageId: "pkg_abc123"

[10:30:15.200] ERROR (PackageController): Error creating package
    err: {
      "type": "PrismaClientValidationError",
      "message": "Invalid price value",
      stack: "..."
    }
```

### Production (JSON)

```json
{
  "level": "INFO",
  "time": "2025-10-21T10:30:15.123Z",
  "context": "PackageController",
  "packageName": "Premium VIP Package",
  "msg": "Creating package",
  "env": "production",
  "app": "smart-cashless-api"
}
```

## Best Practices

### ✅ DO

```typescript
// Include relevant context
logger.info({ userId, action: 'login' }, 'User action');

// Log errors with full error object
logger.error({ err: error }, 'Operation failed');

// Use appropriate log levels
logger.warn({ attempts: 3 }, 'Retry limit reached');
logger.error({ err: error }, 'Database error');
logger.fatal({ err: error }, 'Critical system failure');

// Use child loggers for context
const logger = createLogger('PaymentService');
```

### ❌ DON'T

```typescript
// Don't use console.log
console.log('User logged in'); // ❌

// Don't log sensitive data
logger.info({ password: user.password }); // ❌

// Don't log without context
logger.error('Error'); // ❌ - Not helpful

// Don't use wrong log levels
logger.fatal('User not found'); // ❌ - Not fatal
```

## Sensitive Data

The HTTP logger automatically redacts:
- `Authorization` headers → `[REDACTED]`
- `Cookie` headers → `[REDACTED]`

**Remember to never log:**
- Passwords
- API keys
- JWT tokens
- Credit card numbers
- Personal identification numbers

## Monitoring in Production

### View Logs

```bash
# Tail logs in production
npm run start | pino-pretty

# Filter by level
npm run start | pino-pretty --level-label=level --level-first
```

### Integration with Log Services

JSON logs can be easily shipped to:
- **Datadog** - For monitoring and alerts
- **Loggly** - For log aggregation
- **Elasticsearch** - For log analysis
- **CloudWatch** - For AWS deployments
- **LogDNA** - For real-time tail and search

## Performance

Pino is designed for minimal overhead:
- ~10x faster than Winston
- Asynchronous logging (doesn't block event loop)
- Small footprint (~30KB)
- Ideal for high-traffic production servers

## Files Structure

```
backend/src/
├── utils/
│   └── logger.ts                    # Logger configuration
├── middleware/
│   └── httpLogger.middleware.ts     # HTTP request logging
├── utils/
│   └── errorResponse.ts             # Error logging integration
└── index.ts                         # Logger initialization
```

## Troubleshooting

### Logs not appearing

Check your log level:
```bash
LOG_LEVEL=debug npm run dev
```

### Pretty printing not working

Ensure you're in development mode:
```bash
NODE_ENV=development npm run dev
```

### Too many logs

Increase the log level:
```bash
LOG_LEVEL=warn npm run dev  # Only warnings and errors
```

## References

- [Pino Documentation](https://getpino.io/)
- [Pino Best Practices](https://getpino.io/#/docs/best-practices)
- [Pino Pretty](https://github.com/pinojs/pino-pretty)
