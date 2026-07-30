export function parseTargetBranchFromIssueBody(body: string): string | null {
  const match = body.match(/^Target branch:\s*(.+)$/m);
  return match?.[1]?.trim() ?? null;
}
