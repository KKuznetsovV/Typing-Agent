import { Request, Response } from 'express';
import { runIssueWebhookAgent } from '../services/openai-agent.service';

const TYPING_AGENT_MARKER = '[TypingAgent]';

interface IssueWebhookPayload {
  action: string;
  issue?: {
    title: string;
    body: string | null;
  };
  repository?: {
    full_name?: string;
  };
}

export function handleGitHubWebhook(req: Request, res: Response): void {
  const event = req.get('x-github-event');

  if (event === 'ping') {
    res.status(200).json({ message: 'pong' });
    return;
  }

  if (event === 'issues') {
    const payload = req.body as IssueWebhookPayload;

    if (payload.action === 'opened' && payload.issue) {
      if (!payload.issue.title.includes(TYPING_AGENT_MARKER)) {
        console.log('Ignoring irrelevant issue:', payload.issue.title);
      } else {
        console.log('[GitHub webhook] New issue title:', payload.issue.title);
        console.log('[GitHub webhook] New issue body:', payload.issue.body ?? '');

        const repositoryFullName = payload.repository?.full_name ?? 'unknown/unknown';
        void runIssueWebhookAgent({
          repositoryFullName,
          issueTitle: payload.issue.title,
          issueBody: payload.issue.body ?? '',
        })
          .then((agentOutput) => {
            if (agentOutput) {
              console.log('[GitHub webhook] OpenAI agent response:\n', agentOutput);
            }
          })
          .catch((error: unknown) => {
            console.error('[GitHub webhook] OpenAI agent failed:', error);
          });
      }
    }
  }

  res.status(200).json({ received: true });
}