import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.jwtPayload!.userId;
    const user = await User.findById(userId).select('-__v');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}
