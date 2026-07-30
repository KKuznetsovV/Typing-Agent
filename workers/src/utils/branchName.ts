export function slugifyIssueTitle(title: string): string {
  const slug = title
    .replace(/\[TypingAgent[^\]]*\]/gi, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'issue';
}

export function buildFeatureBranchName(issueNumber: number, issueTitle: string): string {
  return `feature-${issueNumber}-${slugifyIssueTitle(issueTitle)}`;
}

export function isFeatureBranchName(branchName: string): boolean {
  return /^feature-\d+-/.test(branchName);
}

export function parseFeatureBranchIssueNumber(branchName: string): number | null {
  const match = branchName.match(/^feature-(\d+)-/);
  if (!match) return null;
  const issueNumber = Number(match[1]);
  return Number.isFinite(issueNumber) ? issueNumber : null;
}

export type DeveloperAgentRole = 'backend-dev' | 'frontend-dev' | 'devops';

export function buildDeveloperBranchName(
  featureBranchName: string,
  agentRole: DeveloperAgentRole,
  issueNumber: number
): string {
  return `${featureBranchName}-${agentRole}-${issueNumber}`;
}
