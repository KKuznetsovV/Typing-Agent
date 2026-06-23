import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import type { VerifyCallback } from 'passport-oauth2';
import { appConfig } from '../config';
import { User } from '../models/User';

export function configurePassport(): void {
  passport.use(
    new GitHubStrategy(
      {
        clientID: appConfig.github.clientId,
        clientSecret: appConfig.github.clientSecret,
        callbackURL: appConfig.github.callbackUrl,
        scope: ['repo', 'admin:repo_hook'],
      },
      async (accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          let user = await User.findOne({ githubId: profile.id });

          if (!user) {
            user = await User.create({
              githubId: profile.id,
              username: profile.username ?? profile.id,
              displayName: profile.displayName,
              email: profile.emails?.[0]?.value,
              avatarUrl: profile.photos?.[0]?.value,
              githubAccessToken: accessToken,
            });
          } else {
            // Update access token on each login to keep it current
            user.githubAccessToken = accessToken;
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}
