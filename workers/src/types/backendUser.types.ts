export interface BackendUser {
  id: string;
  githubId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  githubAccessToken?: string;
}
