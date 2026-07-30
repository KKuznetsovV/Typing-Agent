import { RepoRegistration } from '../models/RepoRegistration';

export async function upsertRepoRegistration(
  userId: string,
  repoOwner: string,
  repoName: string
): Promise<void> {
  await RepoRegistration.findOneAndUpdate(
    { repoOwner, repoName },
    { userId, repoOwner, repoName },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

export async function findUserIdByRepo(
  repoOwner: string,
  repoName: string
): Promise<string | null> {
  const registration = await RepoRegistration.findOne({ repoOwner, repoName });
  return registration ? registration.userId.toString() : null;
}
