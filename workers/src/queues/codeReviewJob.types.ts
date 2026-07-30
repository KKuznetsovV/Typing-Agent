export interface CodeReviewJobMessage {
  userId: string;
  repoOwner: string;
  repoName: string;
  pullRequestNumber: number;
  pullRequestTitle: string;
  pullRequestBody: string;
  headBranch: string;
  baseBranch: string;
}
