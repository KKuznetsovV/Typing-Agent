import { Request, Response } from 'express';
import { appConfig } from '../config';
import { IUser } from '../models/User';
import { signToken } from '../services/auth.service';
import { registerWebhooksForUser } from '../services/github.service';
import { logError } from '../logger';

export function handleGitHubCallback(req: Request, res: Response): void {
  const user = req.user as unknown as IUser;
  const token = signToken(user._id.toString());
  res.redirect(`${appConfig.frontend.url}?token=${token}`);

  if (user.githubAccessToken) {
    registerWebhooksForUser(user.githubAccessToken, user._id.toString()).catch(
      (error: unknown) => {
        logError('Failed to register webhooks after GitHub login', error);
      }
    );
  }
}

export function logout(_req: Request, res: Response): void {
  res.clearCookie('token');
  res.json({ success: true });
}
