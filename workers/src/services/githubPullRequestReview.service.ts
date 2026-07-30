import { githubApiFetch } from './githubApi';

export async function mergePullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
  commitTitle?: string
): Promise<void> {
  await githubApiFetch(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
    accessToken,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        merge_method: 'squash',
        ...(commitTitle ? { commit_title: commitTitle } : {}),
      }),
    }
  );
}

export async function addPullRequestComment(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string
): Promise<void> {
  await githubApiFetch(
    `/repos/${owner}/${repo}/issues/${pullNumber}/comments`,
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }
  );
}
