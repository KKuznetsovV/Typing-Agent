export interface AgentJobMessage {
  userId: string;
  repoOwner: string;
  repoName: string;
  issueNumber: number;
  issueTitle: string;
  issueBody: string;
  branchName?: string;
}
