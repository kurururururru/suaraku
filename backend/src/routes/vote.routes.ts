import { Router } from 'express';
import { castVote, getMyReceipt } from '../controllers/vote.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { voteLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/', authMiddleware, requireRole('VOTER'), voteLimiter, castVote);
router.get('/my-receipt', authMiddleware, requireRole('VOTER'), getMyReceipt);

export default router;
