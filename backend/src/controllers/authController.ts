import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig, frontendConfig } from '../config';
import { IUser } from '../models/User';

export function githubCallback(req: Request, res: Response, next: NextFunction): void {
  try {
    const user = req.user as unknown as IUser;

    if (!user) {
      res.redirect(`${frontendConfig.url}?error=auth_failed`);
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn as jwt.SignOptions['expiresIn'] }
    );

    // Redirect to frontend with token; frontend reads it from the URL then
    // clears it with history.replaceState to avoid leaking it in browser history
    res.redirect(`${frontendConfig.url}?token=${encodeURIComponent(token)}`);
  } catch (err) {
    next(err);
  }
}
