export type TypingAgentRoute = 'techLead' | 'backendDev' | 'frontendDev' | 'devOps';

/** Maps issue title markers to their target agent queue. */
export function resolveTypingAgentRoute(title: string): TypingAgentRoute | null {
  if (/\[TypingAgent-BackendDev\]/i.test(title)) return 'backendDev';
  if (/\[TypingAgent-FrontendDev\]/i.test(title)) return 'frontendDev';
  if (/\[TypingAgent-DevOps\]/i.test(title)) return 'devOps';
  if (/\[TypingAgent\]/.test(title)) return 'techLead';
  return null;
}

export function isCodeReviewerPullRequestTitle(title: string): boolean {
  return /\[TypingAgent-CodeReviewer\]/i.test(title);
}
