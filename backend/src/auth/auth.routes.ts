// Auth Routes
// Public authentication endpoints

import { Router } from 'express';
import { login, refresh, me } from './auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', requireAuth, me);

export default router;