import express from 'express';
import { Router } from 'express';
import { handleGitHubWebhook } from '../controllers/webhook.controller';
import {
	captureGitHubWebhookRawBody,
	verifyGitHubWebhookSignature,
} from '../middleware/githubWebhook';

const router = Router();

router.post(
	'/github',
	express.raw({ type: 'application/json', verify: captureGitHubWebhookRawBody }),
	verifyGitHubWebhookSignature,
	handleGitHubWebhook
);

export default router;