import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Logger
import { logger } from './utils/logger';
import { httpLogger } from './middleware/httpLogger.middleware';

// Routes
import authRoutes from './auth/auth.routes';
import tenantRoutes from './tenant/tenant.routes';
import eventRoutes from './event/event.routes';
import userRoutes from './user/user.routes';
import adminRoutes from './admin/admin.routes';
import paymentRoutes from './payment/payment.routes';
import reportsRoutes from './reports/reports.routes';
import packageRoutes from './package/package.routes';
import rewardRoutes from './reward/reward.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// HTTP Request logging with Pino (replaces Morgan)
app.use(httpLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'smart-cashless-hub-api',
  });
});

// API v1 routes
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    message: 'Smart Cashless Hub API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth',
      tenants: '/api/v1/tenants',
      events: '/api/v1/events',
      users: '/api/v1/users',
      packages: '/api/v1/packages',
      rewards: '/api/v1/rewards',
      payments: '/api/v1/payments',
      reports: '/api/v1/reports',
      admin: '/api/v1/admin',
    },
  });
});

// Public routes
app.use('/api/v1/auth', authRoutes);

// Protected tenant routes
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/packages', packageRoutes);
app.use('/api/v1/rewards', rewardRoutes);

// Payment routes (includes Django webhook endpoints)
app.use('/api/v1/payments', paymentRoutes);

// Reports routes (protected)
app.use('/api/v1/reports', reportsRoutes);

// Admin routes (SUPERADMIN only)
app.use('/api/v1/admin', adminRoutes);

// Start server
app.listen(PORT, () => {
  logger.info({
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    apiUrl: `http://localhost:${PORT}/api/v1`,
  }, 'Server started successfully');

  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled promise rejection');
  process.exit(1);
});

export default app;
