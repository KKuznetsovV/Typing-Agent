import { Router } from 'express';
import passport from 'passport';
import { appConfig } from '../config';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.get('/github', passport.authenticate('github', { session: false }));

router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: appConfig.frontend.url,
  }),
  authController.handleGitHubCallback
);

router.post('/logout', authenticate, authController.logout);

export default router;
