import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { getMe } from '../controllers/userController';

const router = Router();

// All user routes require a valid JWT
router.get('/me', authenticate, getMe);

export default router;
