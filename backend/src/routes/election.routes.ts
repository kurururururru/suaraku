import { Router } from 'express';
import { getActiveElectionHandler, getResultsHandler } from '../controllers/election.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/active', authMiddleware, getActiveElectionHandler);
router.get('/:id/results', authMiddleware, getResultsHandler);

export default router;
