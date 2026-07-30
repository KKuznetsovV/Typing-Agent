import { Router } from 'express';
import * as repoController from '../controllers/repo.controller';
import { authenticateService } from '../middleware/authenticateService';

const router = Router();

/** Internal endpoint — looks up userId by repo owner/name. */
router.get('/:repoOwner/:repoName/user-id', authenticateService, repoController.getUserIdByRepo);

export default router;
