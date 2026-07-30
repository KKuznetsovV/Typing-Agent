export interface PullRequestFileChange {
  path: string;
  status: string;
  patch: string | null;
}

export interface PullRequestSnapshot {
  number: number;
  title: string;
  body: string;
  headRef: string;
  baseRef: string;
  headSha: string;
  htmlUrl: string;
  files: PullRequestFileChange[];
  truncated: boolean;
  skippedCount: number;
}
