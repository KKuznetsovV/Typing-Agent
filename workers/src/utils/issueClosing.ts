const CLOSING_KEYWORD_PATTERN = /\b(?:fixes|closes|resolves)\s+#(\d+)\b/i;

export function parseClosingIssueNumber(text: string): number | null {
  const match = text.match(CLOSING_KEYWORD_PATTERN);
  if (!match) return null;
  const issueNumber = Number(match[1]);
  return Number.isFinite(issueNumber) ? issueNumber : null;
}

export function appendIssueClosingReference(body: string, issueNumber: number): string {
  if (new RegExp(`\\b(?:fixes|closes|resolves)\\s+#${issueNumber}\\b`, 'i').test(body)) {
    return body;
  }
  const trimmed = body.trimEnd();
  return trimmed ? `${trimmed}\n\nfixes #${issueNumber}` : `fixes #${issueNumber}`;
}
