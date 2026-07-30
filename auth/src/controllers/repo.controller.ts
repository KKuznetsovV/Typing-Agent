import { Request, Response } from 'express';
import { findUserIdByRepo } from '../services/repoRegistration.service';

export async function getUserIdByRepo(req: Request, res: Response): Promise<void> {
  const repoOwner = req.params.repoOwner as string;
  const repoName = req.params.repoName as string;

  const userId = await findUserIdByRepo(repoOwner, repoName);
  if (!userId) {
    res.status(404).json({ message: 'Repository not registered' });
    return;
  }

  res.json({ userId });
}
