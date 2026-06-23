import { Request, Response } from 'express';
import { appConfig } from '../config';
import { IUser } from '../models/User';
import { signToken } from '../services/auth.service';
import { registerIssueWebhooksForUser } from '../services/github.service';

export function handleGitHubCallback(req: Request, res: Response): void {
  const user = req.user as unknown as IUser;
  const token = signToken(user._id.toString());
  res.redirect(`${appConfig.frontend.url}?token=${token}`);

  // Trigger webhook registration async (don't await - fire and forget)
  if (user.githubAccessToken) {
    registerIssueWebhooksForUser(user.githubAccessToken).catch((error) => {
      console.error('[GitHub webhook] Failed to register issue webhooks:', error);
    });
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie('token');
  res.json({ success: true });
}
