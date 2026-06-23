import { Request, Response } from 'express';
import { findById } from '../services/user.service';

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
