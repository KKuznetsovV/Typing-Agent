import { appConfig } from '../config';
import { BackendUser } from '../types/backendUser.types';
import { createServiceAuthHeaders } from '../utils/serviceAuth';

export async function fetchUserById(userId: string): Promise<BackendUser | null> {
  const secret = appConfig.serviceAuth.secret;

  const response = await fetch(
    `${appConfig.authService.url}/api/user/${encodeURIComponent(userId)}`,
    { headers: createServiceAuthHeaders(secret) }
  );

  if (response.status === 404) return null;

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Auth user API failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<BackendUser>;
}
