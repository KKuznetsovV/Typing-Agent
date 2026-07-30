import { TECH_LEAD_AGENT_MARKERS } from '../agents/techLead/techLead.types';

const DEV_AGENT_TITLE_PATTERN = new RegExp(
  `\\[(?:${Object.values(TECH_LEAD_AGENT_MARKERS)
    .map((marker) => marker.slice(1, -1))
    .join('|')})\\]`,
  'i'
);

const PARENT_ISSUE_BODY_PATTERN = /^Derived from parent issue #(\d+)\./m;

export function isDevAgentSubIssueForParent(
  title: string,
  body: string | null,
  parentIssueNumber: number
): boolean {
  if (!DEV_AGENT_TITLE_PATTERN.test(title) || !body) return false;

  const match = body.match(PARENT_ISSUE_BODY_PATTERN);
  if (!match) return false;

  return Number(match[1]) === parentIssueNumber;
}
