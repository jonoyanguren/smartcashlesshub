// Event Routes
// Protected routes for tenant-scoped event operations

import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from './event.controller';
import { requireAuth, requireTenant, requireTenantAdmin } from '../middleware/auth.middleware';

const router = Router();

// All event routes require authentication and tenant context
router.use(requireAuth);
router.use(requireTenant);

// Routes
router.get('/', getAllEvents); // Get all events for authenticated tenant
router.get('/:id', getEventById); // Get specific event (if belongs to tenant)
router.post('/', requireTenantAdmin, createEvent); // Create event (admin only)
router.put('/:id', requireTenantAdmin, updateEvent); // Update event (admin only)
router.delete('/:id', requireTenantAdmin, deleteEvent); // Delete event (admin only)

export default router;