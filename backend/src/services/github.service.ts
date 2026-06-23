import { appConfig } from '../config';

interface GitHubRepo {
  name: string;
  owner: { login: string };
  permissions?: { admin?: boolean };
}

interface GitHubHook {
  id: number;
  config: { url: string };
  events: string[];
}

async function githubFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${path} failed (${response.status}): ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function listAdminRepos(accessToken: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const batch = await githubFetch<GitHubRepo[]>(
      `/user/repos?per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
      accessToken
    );

    if (batch.length === 0) {
      break;
    }

    repos.push(...batch.filter((repo) => repo.permissions?.admin));
    page += 1;
  }

  return repos;
}

async function ensureIssueWebhook(
  accessToken: string,
  owner: string,
  repo: string
): Promise<void> {
  const hooks = await githubFetch<GitHubHook[]>(`/repos/${owner}/${repo}/hooks`, accessToken);

  const webhookUrl = appConfig.github.webhookUrl;

  const existing = hooks.find(
    (hook) => hook.config.url === webhookUrl && hook.events.includes('issues')
  );
  if (existing) {
    return;
  }

  await githubFetch(`/repos/${owner}/${repo}/hooks`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'web',
      active: true,
      events: ['issues'],
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret: appConfig.github.webhookSecret,
        insecure_ssl: '0',
      },
    }),
  });

  console.log(`Registered issues webhook on ${owner}/${repo}`);
}

export async function registerIssueWebhooksForUser(accessToken: string): Promise<void> {

  const repos = await listAdminRepos(accessToken);

  for (const repo of repos) {
    try {
      await ensureIssueWebhook(accessToken, repo.owner.login, repo.name);
    } catch (error) {
      console.error(
        `Failed to register webhook for ${repo.owner.login}/${repo.name}:`,
        error
      );
    }
  }
}
