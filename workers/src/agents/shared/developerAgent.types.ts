export interface DeveloperAgentInputBase {
  userId: string;
  repoOwner: string;
  repoName: string;
  issueNumber: number;
  issueTitle: string;
  issueBody: string;
  branchName: string;
}

export interface DeveloperAgentInput extends DeveloperAgentInputBase {
  workBranchName: string;
}
