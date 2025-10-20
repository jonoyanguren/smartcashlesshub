// Tenant Routes

import { Router } from 'express';
import {
  getAllTenants,
  getTenantById,
  getTenantBySlug,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantConfig,
  updateTenantConfig,
} from './tenant.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// GET /api/tenants - Get all tenants
router.get('/', getAllTenants);

// GET /api/tenants/config - Get current tenant configuration (must be before /slug/:slug)
router.get('/config', authMiddleware, getTenantConfig);

// PUT /api/tenants/config - Update current tenant configuration
router.put('/config', authMiddleware, updateTenantConfig);

// GET /api/tenants/slug/:slug - Get tenant by slug (must be before /:id)
router.get('/slug/:slug', getTenantBySlug);

// GET /api/tenants/:id - Get tenant by ID
router.get('/:id', getTenantById);

// POST /api/tenants - Create new tenant (SUPERADMIN only - add auth middleware later)
router.post('/', createTenant);

// PUT /api/tenants/:id - Update tenant (SUPERADMIN or TENANT_ADMIN - add auth middleware later)
router.put('/:id', updateTenant);

// DELETE /api/tenants/:id - Delete tenant (SUPERADMIN only - add auth middleware later)
router.delete('/:id', deleteTenant);

export default router;