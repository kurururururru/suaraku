import { Router } from 'express';
import { getCandidates, getCandidateById } from '../controllers/candidate.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getCandidates);
router.get('/:id', authMiddleware, getCandidateById);

export default router;
