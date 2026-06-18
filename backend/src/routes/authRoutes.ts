import { Router } from 'express';
import passport from 'passport';
import { githubCallback } from '../controllers/authController';

const router = Router();

// Redirect to GitHub OAuth consent screen
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'], session: false })
);

// GitHub redirects back here after the user authorises the app
router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: '/?error=auth_failed',
  }),
  githubCallback
);

export default router;
