export interface RepositoryFile {
  path: string;
  content: string;
}

export interface RepositorySnapshot {
  files: RepositoryFile[];
  truncated: boolean;
  skippedCount: number;
}
