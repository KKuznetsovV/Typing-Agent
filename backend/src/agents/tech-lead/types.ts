export type TechLeadTargetAgent = 'backend' | 'frontend' | 'devops';

export interface TechLeadIssueDraft {
  agent: TechLeadTargetAgent;
  title: string;
  body: string;
}

export interface TechLeadAgentOutput {
  issues: TechLeadIssueDraft[];
}

export interface TechLeadIssueInput {
  repositoryFullName: string;
  sourceIssueTitle: string;
  sourceIssueBody: string;
}
