export const TECH_LEAD_AGENT_MARKERS = {
  BackendDev: '[TypingAgent-BackendDev]',
  FrontendDev: '[TypingAgent-FrontendDev]',
  DevOps: '[TypingAgent-DevOps]',
} as const;

export type TechLeadSubAgent = keyof typeof TECH_LEAD_AGENT_MARKERS;

export interface TechLeadAgentInput {
  githubAccessToken: string;
  repoOwner: string;
  repoName: string;
  issueTitle: string;
  issueBody: string;
  parentIssueNumber?: number;
}

export interface TechLeadTaskDraft {
  title: string;
  body: string;
}

export interface TechLeadTaskPlan {
  backendDev: TechLeadTaskDraft | null;
  frontendDev: TechLeadTaskDraft | null;
  devOps: TechLeadTaskDraft | null;
}

export interface CreatedSubIssue {
  agent: TechLeadSubAgent;
  issueNumber: number;
  url: string;
  title: string;
}

export interface TechLeadAgentResult {
  plan: TechLeadTaskPlan;
  createdIssues: CreatedSubIssue[];
  openaiResponseId: string;
  branchName: string;
}
