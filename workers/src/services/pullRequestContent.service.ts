import { PullRequestFileChange, PullRequestSnapshot } from '../types/pullRequest.types';
import { githubApiFetch } from './githubApi';

interface GitHubPullRequestDetail {
  number: number;
  title: string;
  body: string | null;
  head: { ref: string; sha: string };
  base: { ref: string };
  html_url: string;
}

interface GitHubPullRequestFile {
  filename: string;
  status: string;
  patch?: string;
}

const MAX_PATCH_CHARS = 8_000;
const MAX_FILES = 100;

function truncatePatch(patch: string | undefined): string | null {
  if (!patch) return null;
  if (patch.length <= MAX_PATCH_CHARS) return patch;
  return `${patch.slice(0, MAX_PATCH_CHARS)}… (${patch.length} chars total)`;
}

export async function fetchPullRequestSnapshot(
  accessToken: string,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<PullRequestSnapshot> {
  const pr = await githubApiFetch<GitHubPullRequestDetail>(
    `/repos/${owner}/${repo}/pulls/${pullNumber}`,
    accessToken
  );

  const rawFiles = await githubApiFetch<GitHubPullRequestFile[]>(
    `/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=${MAX_FILES}`,
    accessToken
  );

  const files: PullRequestFileChange[] = [];
  let skippedCount = 0;

  for (const file of rawFiles) {
    if (files.length >= MAX_FILES) {
      skippedCount++;
      continue;
    }
    files.push({ path: file.filename, status: file.status, patch: truncatePatch(file.patch) });
  }

  return {
    number: pr.number,
    title: pr.title,
    body: pr.body ?? '',
    headRef: pr.head.ref,
    baseRef: pr.base.ref,
    headSha: pr.head.sha,
    htmlUrl: pr.html_url,
    files,
    truncated: rawFiles.length > MAX_FILES,
    skippedCount,
  };
}
