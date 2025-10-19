import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Routes
import authRoutes from './auth/auth.routes';
import tenantRoutes from './tenant/tenant.routes';
import eventRoutes from './event/event.routes';
import userRoutes from './user/user.routes';
import adminRoutes from './admin/admin.routes';
import paymentRoutes from './payment/payment.routes';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
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
      payments: '/api/v1/payments',
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

// Payment routes (includes Django webhook endpoints)
app.use('/api/v1/payments', paymentRoutes);

// Admin routes (SUPERADMIN only)
app.use('/api/v1/admin', adminRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
});

export default app;
