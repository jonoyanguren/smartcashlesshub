// Reports Routes
// Protected routes for export operations

import { Router } from 'express';
import {
  exportEventStats,
  exportEventsSummary,
  exportPaymentHistory,
  exportUserPayments,
} from './reports.controller';
import { requireAuth, requireTenant } from '../middleware/auth.middleware';

const router = Router();

// All report routes require authentication and tenant context
router.use(requireAuth);
router.use(requireTenant);

// Routes
router.get('/event-stats/:eventId', exportEventStats); // Export single event statistics
router.get('/events-summary', exportEventsSummary); // Export all events summary
router.get('/payments', exportPaymentHistory); // Export payment history (with optional filters)
router.get('/user/:userId', exportUserPayments); // Export user payment report

export default router;