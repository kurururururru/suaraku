import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import {
  getAdminStats,
  getVoters,
  createVoter,
  updateVoter,
  deleteVoter,
  getAdminCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  getAdminElection,
  createElection,
  updateElection,
  openElectionHandler,
  closeElectionHandler,
  getAdminResults,
  publishResultsHandler,
  getParticipationTimeline,
  getAuditLogs,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + ADMIN role
router.use(authMiddleware, requireRole('ADMIN'));

// Stats
router.get('/stats', getAdminStats);
router.get('/participation-timeline', getParticipationTimeline);

// Voters
router.get('/voters', getVoters);
router.post('/voters', createVoter);
router.put('/voters/:id', updateVoter);
router.delete('/voters/:id', deleteVoter);

// Candidates
router.get('/candidates', getAdminCandidates);
router.post('/candidates', createCandidate);
router.put('/candidates/:id', updateCandidate);
router.delete('/candidates/:id', deleteCandidate);

// Election
router.get('/election', getAdminElection);
router.post('/election', createElection);
router.put('/election/:id', updateElection);
router.patch('/election/open', openElectionHandler);
router.patch('/election/close', closeElectionHandler);
router.patch('/election/publish', publishResultsHandler);

// Results
router.get('/results', getAdminResults);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

export default router;
