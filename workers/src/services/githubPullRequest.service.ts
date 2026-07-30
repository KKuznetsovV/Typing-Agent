import { githubApiFetch } from './githubApi';

interface GitHubPullRequest { number: number; html_url: string }
interface GitHubPullRequestListItem { number: number; html_url: string }

export interface CreatePullRequestResult {
  number: number;
  html_url: string;
}

export async function createPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  headBranch: string,
  baseBranch: string,
  title: string,
  body: string
): Promise<CreatePullRequestResult> {
  try {
    const pr = await githubApiFetch<GitHubPullRequest>(
      `/repos/${owner}/${repo}/pulls`,
      accessToken,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, head: headBranch, base: baseBranch }),
      }
    );
    return { number: pr.number, html_url: pr.html_url };
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('422')) throw error;

    const existing = await findOpenPullRequest(accessToken, owner, repo, headBranch, baseBranch);
    if (existing) return existing;

    throw error;
  }
}

async function findOpenPullRequest(
  accessToken: string,
  owner: string,
  repo: string,
  headBranch: string,
  baseBranch: string
): Promise<CreatePullRequestResult | null> {
  const query = new URLSearchParams({ state: 'open', head: `${owner}:${headBranch}`, base: baseBranch });
  const pulls = await githubApiFetch<GitHubPullRequestListItem[]>(
    `/repos/${owner}/${repo}/pulls?${query.toString()}`,
    accessToken
  );
  const match = pulls[0];
  return match ? { number: match.number, html_url: match.html_url } : null;
}
