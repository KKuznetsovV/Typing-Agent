import { appConfig } from '../config';
import { createServiceAuthHeaders } from '../utils/serviceAuth';

export async function fetchUserIdByRepo(
  repoOwner: string,
  repoName: string
): Promise<string | null> {
  const secret = appConfig.serviceAuth.secret;

  const response = await fetch(
    `${appConfig.authService.url}/api/repos/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}/user-id`,
    { headers: createServiceAuthHeaders(secret) }
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth repo lookup failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as { userId: string };
  return data.userId;
}
