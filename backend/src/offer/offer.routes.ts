// Offer Routes
// RESTful routes for offer management

import { Router } from 'express';
import {
  listOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
} from './offer.controller';
import { requireAuth, requireTenant } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(requireAuth);
router.use(requireTenant);

// List offers (with optional filters: eventId, status, type)
// GET /api/v1/offers?eventId=xxx&status=ACTIVE&type=BUNDLE
router.get('/', listOffers);

// Get single offer by ID
// GET /api/v1/offers/:id
router.get('/:id', getOffer);

// Create new offer
// POST /api/v1/offers
router.post('/', createOffer);

// Update offer
// PUT /api/v1/offers/:id
router.put('/:id', updateOffer);

// Delete offer
// DELETE /api/v1/offers/:id
router.delete('/:id', deleteOffer);

export default router;