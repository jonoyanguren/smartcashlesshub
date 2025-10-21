// Reward Routes
// RESTful routes for reward management

import { Router } from 'express';
import {
  listRewards,
  getReward,
  createReward,
  updateReward,
  deleteReward,
} from './reward.controller';
import { requireAuth, requireTenant } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(requireAuth);
router.use(requireTenant);

// List rewards (with optional filters: eventId, status)
// GET /api/v1/rewards?eventId=xxx&status=ACTIVE
router.get('/', listRewards);

// Get single reward by ID
// GET /api/v1/rewards/:id
router.get('/:id', getReward);

// Create new reward
// POST /api/v1/rewards
router.post('/', createReward);

// Update reward
// PUT /api/v1/rewards/:id
router.put('/:id', updateReward);

// Delete reward
// DELETE /api/v1/rewards/:id
router.delete('/:id', deleteReward);

export default router;