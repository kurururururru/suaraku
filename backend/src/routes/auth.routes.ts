import { Router } from 'express';
import { login, registerKey, getMe } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { loginLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/login', loginLimiter, login);
router.post('/register-key', authMiddleware, requireRole('VOTER'), registerKey);
router.get('/me', authMiddleware, getMe);

export default router;
