import { Request, Response } from 'express';
import { findById, findByIdWithAccessToken } from '../services/user.service';

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await findById(req.user!.sub!);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    id: user._id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  });
}

/** Internal endpoint — called by other services via service auth. */
export async function getUserById(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId as string;

  const user = await findByIdWithAccessToken(userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({
    id: user._id,
    githubId: user.githubId,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    email: user.email,
    githubAccessToken: user.githubAccessToken,
  });
}
