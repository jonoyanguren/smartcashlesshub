// Auth Routes
// Public authentication endpoints

import { Router } from 'express';
import { login, refresh, me, changePassword } from './auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.get('/me', requireAuth, me);
router.put('/change-password', requireAuth, changePassword);

export default router;