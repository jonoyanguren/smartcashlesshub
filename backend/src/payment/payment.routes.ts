// Payment Routes
// Routes for payment operations including Django webhook integration

import { Router } from 'express';
import {
  getEventPayments,
  createPayment,
  updatePaymentStatus,
  getEventPaymentStats,
} from './payment.controller';
import { requireAuth, requireTenant } from '../middleware/auth.middleware';

const router = Router();

// Django webhook routes (no auth required - Django will use API key)
// TODO: Add API key validation middleware for Django webhook routes
router.post('/', createPayment); // Create payment from Django
router.patch('/:djangoPaymentId', updatePaymentStatus); // Update payment status from Django

// Protected routes (require authentication and tenant context)
router.get('/events/:eventId', requireAuth, requireTenant, getEventPayments); // Get payments for an event
router.get('/events/:eventId/stats', requireAuth, requireTenant, getEventPaymentStats); // Get payment stats for an event

export default router;