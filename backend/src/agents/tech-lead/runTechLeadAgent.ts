import OpenAI from 'openai';
import { appConfig } from '../../config';
import { TECH_LEAD_AGENT_SYSTEM_PROMPT } from './systemPrompt';
import { TechLeadAgentOutput, TechLeadIssueInput, TechLeadIssueDraft, TechLeadTargetAgent } from './types';

const openaiClient = appConfig.openai.apiKey
  ? new OpenAI({ apiKey: appConfig.openai.apiKey })
  : null;

const titlePrefixes: Record<TechLeadTargetAgent, string> = {
  backend: '[TypingAgent-BackendDev]',
  frontend: '[TypingAgent-FrontendDev]',
  devops: '[TypingAgent-DevOps]',
};

function sanitizeIssues(issues: unknown): TechLeadIssueDraft[] {
  if (!Array.isArray(issues)) {
    return [];
  }

  const seen = new Set<TechLeadTargetAgent>();
  const validAgents: TechLeadTargetAgent[] = ['backend', 'frontend', 'devops'];
  const output: TechLeadIssueDraft[] = [];

  for (const item of issues) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const draft = item as Partial<TechLeadIssueDraft>;
    if (!draft.agent || !validAgents.includes(draft.agent)) {
      continue;
    }

    if (seen.has(draft.agent)) {
      continue;
    }

    if (typeof draft.title !== 'string' || typeof draft.body !== 'string') {
      continue;
    }

    const requiredPrefix = titlePrefixes[draft.agent];
    const title = draft.title.trim();
    const body = draft.body.trim();

    if (!title.startsWith(requiredPrefix) || !body) {
      continue;
    }

    output.push({
      agent: draft.agent,
      title,
      body,
    });

    seen.add(draft.agent);

    if (output.length >= 3) {
      break;
    }
  }

  return output;
}

export async function runTechLeadAgent(
  input: TechLeadIssueInput
): Promise<TechLeadAgentOutput | null> {
  if (!appConfig.openai.enabled) {
    return null;
  }

  if (!openaiClient) {
    console.warn('[OpenAI][TechLead] OPENAI_ENABLED=true but OPENAI_API_KEY is missing');
    return null;
  }

  const userPrompt = [
    `Repository: ${input.repositoryFullName}`,
    `Source issue title: ${input.sourceIssueTitle}`,
    `Source issue body: ${input.sourceIssueBody || '(empty)'}`,
    '',
    'Create up to 3 derived issue drafts according to your instructions.',
  ].join('\n');

  const response = await openaiClient.responses.create({
    model: appConfig.openai.model,
    instructions: TECH_LEAD_AGENT_SYSTEM_PROMPT,
    input: userPrompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'tech_lead_issue_split',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            issues: {
              type: 'array',
              maxItems: 3,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  agent: { type: 'string', enum: ['backend', 'frontend', 'devops'] },
                  title: { type: 'string' },
                  body: { type: 'string' },
                },
                required: ['agent', 'title', 'body'],
              },
            },
          },
          required: ['issues'],
        },
      },
    },
  });

  const outputText = typeof response.output_text === 'string' ? response.output_text : '';
  if (!outputText.trim()) {
    return { issues: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    console.warn('[OpenAI][TechLead] Non-JSON output_text received');
    return { issues: [] };
  }

  const rawIssues =
    parsed && typeof parsed === 'object'
      ? (parsed as { issues?: unknown }).issues
      : [];

  return {
    issues: sanitizeIssues(rawIssues),
  };
}
