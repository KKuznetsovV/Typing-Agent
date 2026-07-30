import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import { VerifyCallback } from 'passport-oauth2';
import { appConfig } from '../config';
import { registerWebhooksForUser } from '../services/github.service';
import { findOrCreateFromGitHub } from '../services/user.service';
import { logError } from '../logger';

passport.use(
  new GitHubStrategy(
    {
      clientID: appConfig.github.clientId,
      clientSecret: appConfig.github.clientSecret,
      callbackURL: appConfig.github.callbackUrl,
      scope: ['user:email', 'repo', 'admin:repo_hook'],
    },
    async (
      accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        const user = await findOrCreateFromGitHub(profile, accessToken);

        registerWebhooksForUser(accessToken, user._id.toString()).catch(
          (error: unknown) => {
            logError('Failed to register webhooks after OAuth', error);
          }
        );

        done(null, user as unknown as Express.User);
      } catch (error) {
        done(error as Error);
      }
    }
  )
);

export default passport;
