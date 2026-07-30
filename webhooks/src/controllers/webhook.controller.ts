import { Request, Response } from 'express';
import { logError, logger } from '../logger';
import { enqueueAgentJob } from '../queues/enqueueAgentJob';
import { enqueueCodeReviewJob } from '../queues/enqueueCodeReviewJob';
import { resolveTypingAgentRoute, isCodeReviewerPullRequestTitle } from '../queues/routing';
import { parseTargetBranchFromIssueBody } from '../utils/issueBody';
import { fetchUserIdByRepo } from '../services/authClient.service';

interface IssueWebhookPayload {
  action: string;
  repository?: { name: string; owner: { login: string } };
  issue?: { number: number; title: string; body: string | null };
}

interface PullRequestWebhookPayload {
  action: string;
  repository?: { name: string; owner: { login: string } };
  pull_request?: {
    number: number;
    title: string;
    body: string | null;
    head: { ref: string };
    base: { ref: string };
  };
}

async function handlePullRequestEvent(
  payload: PullRequestWebhookPayload,
  res: Response
): Promise<boolean> {
  if (payload.action !== 'opened' || !payload.pull_request || !payload.repository) {
    return false;
  }

  const { pull_request: pr, repository } = payload;

  if (!isCodeReviewerPullRequestTitle(pr.title)) {
    logger.info('Ignoring PR without CodeReviewer marker', { title: pr.title });
    res.status(200).send('OK');
    return true;
  }

  logger.info('[webhook] TypingAgent code review PR', { title: pr.title });

  const userId = await fetchUserIdByRepo(repository.owner.login, repository.name);
  if (!userId) {
    logger.warn('No registered user found for repository', {
      repoOwner: repository.owner.login,
      repoName: repository.name,
    });
    res.status(200).send('OK');
    return true;
  }

  await enqueueCodeReviewJob({
    userId,
    repoOwner: repository.owner.login,
    repoName: repository.name,
    pullRequestNumber: pr.number,
    pullRequestTitle: pr.title,
    pullRequestBody: pr.body ?? '',
    headBranch: pr.head.ref,
    baseBranch: pr.base.ref,
  });

  res.status(200).send('OK');
  return true;
}

export async function handleGithubWebhook(req: Request, res: Response): Promise<void> {
  const event = req.get('x-github-event');
  const rawPayload = JSON.parse((req.body as Buffer).toString()) as Record<string, unknown>;

  if (event === 'ping') {
    res.status(200).json({ message: 'pong' });
    return;
  }

  if (event === 'pull_request') {
    const handled = await handlePullRequestEvent(
      rawPayload as unknown as PullRequestWebhookPayload,
      res
    );
    if (handled) return;
  }

  if (event !== 'issues') {
    res.status(200).send('OK');
    return;
  }

  const payload = rawPayload as unknown as IssueWebhookPayload;

  if (payload.action !== 'opened' || !payload.issue || !payload.repository) {
    res.status(200).send('OK');
    return;
  }

  const { issue, repository } = payload;
  const route = resolveTypingAgentRoute(issue.title);

  if (!route) {
    logger.info('Ignoring irrelevant issue', { title: issue.title });
    res.status(200).send('OK');
    return;
  }

  logger.info(`[webhook] TypingAgent issue (${route})`, { title: issue.title });

  const userId = await fetchUserIdByRepo(repository.owner.login, repository.name);
  if (!userId) {
    logger.warn('No registered user found for repository', {
      repoOwner: repository.owner.login,
      repoName: repository.name,
    });
    res.status(200).send('OK');
    return;
  }

  let branchName: string | undefined;
  if (route !== 'techLead') {
    const parsed = parseTargetBranchFromIssueBody(issue.body ?? '');
    if (!parsed) {
      logger.error('[webhook] No target branch in sub-agent issue body', {
        route,
        issueNumber: issue.number,
      });
      res.status(200).send('OK');
      return;
    }
    branchName = parsed;
  }

  try {
    await enqueueAgentJob(route, {
      userId,
      repoOwner: repository.owner.login,
      repoName: repository.name,
      issueNumber: issue.number,
      issueTitle: issue.title,
      issueBody: issue.body ?? '',
      branchName,
    });
  } catch (error) {
    logError(`Failed to enqueue ${route} job`, error);
    res.status(500).json({ message: 'Failed to enqueue job' });
    return;
  }

  res.status(200).send('OK');
}
