import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';
import { authenticateService } from '../middleware/authenticateService';

const router = Router();

router.get('/me', authenticate, userController.getMe);

/** Internal endpoint — fetches user with githubAccessToken for other services. */
router.get('/:userId', authenticateService, userController.getUserById);

export default router;
