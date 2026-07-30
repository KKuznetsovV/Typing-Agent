import { GeneratedCodeFile } from '../agents/shared/codeGeneration.schema';
import { AgentGitIdentity } from '../utils/agentIdentity';
import { githubApiFetch } from './githubApi';

interface GitHubGitRef { object: { sha: string } }
interface GitHubGitCommit { tree: { sha: string } }
interface GitHubBlob { sha: string }
interface GitHubTree { sha: string }
interface GitHubCreatedCommit { sha: string }

export interface CommitFilesResult {
  commitSha: string;
}

export async function commitFilesToBranch(
  accessToken: string,
  owner: string,
  repo: string,
  branchName: string,
  commitMessage: string,
  files: GeneratedCodeFile[],
  agentIdentity: AgentGitIdentity
): Promise<CommitFilesResult> {
  if (files.length === 0) throw new Error('Cannot commit without file changes');

  const branchRef = await githubApiFetch<GitHubGitRef>(
    `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branchName)}`,
    accessToken
  );

  const currentCommit = await githubApiFetch<GitHubGitCommit>(
    `/repos/${owner}/${repo}/git/commits/${branchRef.object.sha}`,
    accessToken
  );

  const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [];

  for (const file of files) {
    const blob = await githubApiFetch<GitHubBlob>(
      `/repos/${owner}/${repo}/git/blobs`,
      accessToken,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: file.content, encoding: 'utf-8' }),
      }
    );
    treeEntries.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const tree = await githubApiFetch<GitHubTree>(
    `/repos/${owner}/${repo}/git/trees`,
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base_tree: currentCommit.tree.sha, tree: treeEntries }),
    }
  );

  const committedAt = new Date().toISOString();
  const commit = await githubApiFetch<GitHubCreatedCommit>(
    `/repos/${owner}/${repo}/git/commits`,
    accessToken,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage,
        tree: tree.sha,
        parents: [branchRef.object.sha],
        author: { name: agentIdentity.name, email: agentIdentity.email, date: committedAt },
        committer: { name: agentIdentity.name, email: agentIdentity.email, date: committedAt },
      }),
    }
  );

  await githubApiFetch(
    `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branchName)}`,
    accessToken,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sha: commit.sha }),
    }
  );

  return { commitSha: commit.sha };
}
