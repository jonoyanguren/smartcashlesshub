// User Routes
// Protected routes for tenant-scoped user operations

import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from './user.controller';
import { requireAuth, requireTenant, requireTenantAdmin } from '../middleware/auth.middleware';

const router = Router();

// All user routes require authentication and tenant context
router.use(requireAuth);
router.use(requireTenant);

// Routes - Only TENANT_ADMIN can manage users
router.get('/', requireTenantAdmin, getAllUsers); // Get all users for authenticated tenant
router.get('/:id', requireTenantAdmin, getUserById); // Get specific user
router.post('/', requireTenantAdmin, createUser); // Create user (admin only)
router.put('/:id', requireTenantAdmin, updateUser); // Update user (admin only)
router.delete('/:id', requireTenantAdmin, deleteUser); // Delete user (admin only)

export default router;