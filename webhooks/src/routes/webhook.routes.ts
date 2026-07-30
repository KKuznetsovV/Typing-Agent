import { Router } from 'express';
import { handleGithubWebhook } from '../controllers/webhook.controller';
import { verifyGithubWebhook } from '../middleware/verifyGithubWebhook';

const router = Router();

router.post('/', verifyGithubWebhook, handleGithubWebhook);

export default router;
