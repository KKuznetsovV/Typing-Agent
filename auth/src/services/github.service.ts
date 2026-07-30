import { appConfig } from '../config';
import { logError, logger } from '../logger';
import { upsertRepoRegistration } from './repoRegistration.service';
import { githubApiFetch } from './githubApi';

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

const TYPING_AGENT_WEBHOOK_EVENTS = ['issues', 'pull_request'] as const;

async function listAdminRepos(accessToken: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (true) {
    const batch = await githubApiFetch<GitHubRepo[]>(
      `/user/repos?per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
      accessToken
    );

    if (batch.length === 0) break;

    repos.push(...batch.filter((repo) => repo.permissions?.admin));
    page += 1;
  }

  return repos;
}

async function ensureTypingAgentWebhook(
  accessToken: string,
  owner: string,
  repo: string
): Promise<void> {
  const hooks = await githubApiFetch<GitHubHook[]>(
    `/repos/${owner}/${repo}/hooks`,
    accessToken
  );

  const webhookUrl = appConfig.github.webhookUrl;
  const existing = hooks.find((hook) => hook.config.url === webhookUrl);

  if (existing) {
    const missingEvents = TYPING_AGENT_WEBHOOK_EVENTS.filter(
      (event) => !existing.events.includes(event)
    );
    if (missingEvents.length === 0) return;

    await githubApiFetch(`/repos/${owner}/${repo}/hooks/${existing.id}`, accessToken, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [...new Set([...existing.events, ...TYPING_AGENT_WEBHOOK_EVENTS])],
      }),
    });

    logger.info(`Updated webhook events on ${owner}/${repo}: ${missingEvents.join(', ')}`);
    return;
  }

  await githubApiFetch(`/repos/${owner}/${repo}/hooks`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'web',
      active: true,
      events: [...TYPING_AGENT_WEBHOOK_EVENTS],
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret: appConfig.github.webhookSecret,
        insecure_ssl: '0',
      },
    }),
  });

  logger.info(`Registered TypingAgent webhook on ${owner}/${repo}`);
}

export async function registerWebhooksForUser(
  accessToken: string,
  userId: string
): Promise<void> {
  const repos = await listAdminRepos(accessToken);

  for (const repo of repos) {
    try {
      await ensureTypingAgentWebhook(accessToken, repo.owner.login, repo.name);
      await upsertRepoRegistration(userId, repo.owner.login, repo.name);
    } catch (error) {
      logError(`Failed to register webhook for ${repo.owner.login}/${repo.name}`, error);
    }
  }
}
