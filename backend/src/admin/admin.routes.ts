// Admin Routes
// Superadmin-only routes with full system access

import { Router } from 'express';
import {
  getAllTenants,
  getTenantById,
  getAllEvents,
  getEventById,
  getAllUsers,
  getUserById,
  getSystemStats,
} from './admin.controller';
import { requireAuth, requireSuperAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and SUPERADMIN role
router.use(requireAuth);
router.use(requireSuperAdmin);

// Tenant management
router.get('/tenants', getAllTenants);
router.get('/tenants/:id', getTenantById);

// Event management (across all tenants)
router.get('/events', getAllEvents);
router.get('/events/:id', getEventById);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);

// System statistics
router.get('/stats', getSystemStats);

export default router;