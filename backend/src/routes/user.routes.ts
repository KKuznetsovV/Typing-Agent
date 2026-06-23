import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/me', authenticate, userController.getMe);

export default router;
