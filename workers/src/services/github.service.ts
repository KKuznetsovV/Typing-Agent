import { githubApiFetch } from './githubApi';
import { isDevAgentSubIssueForParent } from '../utils/devSubIssue';

interface GitHubIssue {
  number: number;
  html_url: string;
  title: string;
}

interface GitHubIssueListItem {
  number: number;
  title: string;
  body: string | null;
  pull_request?: { url: string };
}

interface GitHubRepoDetails {
  default_branch: string;
}

interface GitHubGitRef {
  object: { sha: string };
}

export async function createIssue(
  accessToken: string,
  owner: string,
  repo: string,
  title: string,
  body: string
): Promise<GitHubIssue> {
  return githubApiFetch<GitHubIssue>(`/repos/${owner}/${repo}/issues`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, body }),
  });
}

export async function closeIssue(
  accessToken: string,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<void> {
  await githubApiFetch(`/repos/${owner}/${repo}/issues/${issueNumber}`, accessToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: 'closed', state_reason: 'completed' }),
  });
}

export async function createBranchFromBase(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string,
  baseBranchName: string
): Promise<void> {
  const baseRef = await githubApiFetch<GitHubGitRef>(
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranchName)}`,
    accessToken
  );

  try {
    await githubApiFetch(`/repos/${owner}/${repo}/git/refs`, accessToken, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      }),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('422') &&
      error.message.includes('Reference already exists')
    ) {
      return;
    }
    throw error;
  }
}

export async function createFeatureBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string
): Promise<void> {
  const repoDetails = await githubApiFetch<GitHubRepoDetails>(
    `/repos/${owner}/${repo}`,
    accessToken
  );
  await createBranchFromBase(accessToken, owner, repo, branchName, repoDetails.default_branch);
}

export async function getDefaultBranch(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string> {
  const repoDetails = await githubApiFetch<GitHubRepoDetails>(
    `/repos/${owner}/${repo}`,
    accessToken
  );
  return repoDetails.default_branch;
}

export async function listOpenDevSubIssuesForParent(
  accessToken: string,
  owner: string,
  repo: string,
  parentIssueNumber: number,
  excludeIssueNumbers: number[] = []
): Promise<GitHubIssueListItem[]> {
  const excluded = new Set(excludeIssueNumbers);
  const issues = await githubApiFetch<GitHubIssueListItem[]>(
    `/repos/${owner}/${repo}/issues?state=open&per_page=100`,
    accessToken
  );
  return issues.filter(
    (issue) =>
      !excluded.has(issue.number) &&
      !issue.pull_request &&
      isDevAgentSubIssueForParent(issue.title, issue.body, parentIssueNumber)
  );
}
