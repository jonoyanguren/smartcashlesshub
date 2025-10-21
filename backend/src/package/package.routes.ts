// Package Routes
// RESTful routes for package management

import { Router } from 'express';
import {
  listPackages,
  getPackage,
  createPackage,
  updatePackage,
  deletePackage,
} from './package.controller';
import { requireAuth, requireTenant } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(requireAuth);
router.use(requireTenant);

// List packages (with optional filters: eventId, status)
// GET /api/v1/packages?eventId=xxx&status=ACTIVE
router.get('/', listPackages);

// Get single package by ID
// GET /api/v1/packages/:id
router.get('/:id', getPackage);

// Create new package
// POST /api/v1/packages
router.post('/', createPackage);

// Update package
// PUT /api/v1/packages/:id
router.put('/:id', updatePackage);

// Delete package
// DELETE /api/v1/packages/:id
router.delete('/:id', deletePackage);

export default router;