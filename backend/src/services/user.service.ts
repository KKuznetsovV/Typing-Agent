import { Profile } from 'passport-github2';
import { IUser, User } from '../models/User';

export async function findOrCreateFromGitHub(
  profile: Profile,
  accessToken: string
): Promise<IUser> {
  const githubId = profile.id;
  const email = profile.emails?.[0]?.value;

  const user = await User.findOneAndUpdate(
    { githubId },
    {
      githubId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.photos?.[0]?.value,
      email,
      githubAccessToken: accessToken,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return user;
}

export async function findById(id: string): Promise<IUser | null> {
  return User.findById(id);
}
