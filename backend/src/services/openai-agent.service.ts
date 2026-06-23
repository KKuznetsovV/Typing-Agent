import OpenAI from 'openai';
import { appConfig } from '../config';

interface IssueAgentInput {
  repositoryFullName: string;
  issueTitle: string;
  issueBody: string;
}

const openaiClient = appConfig.openai.apiKey
  ? new OpenAI({ apiKey: appConfig.openai.apiKey })
  : null;

function extractResponseText(response: unknown): string {
  if (!response || typeof response !== 'object') {
    return '';
  }

  const maybeOutputText = (response as { output_text?: unknown }).output_text;
  if (typeof maybeOutputText === 'string') {
    return maybeOutputText.trim();
  }

  const maybeOutput = (response as { output?: unknown }).output;
  if (Array.isArray(maybeOutput)) {
    return JSON.stringify(maybeOutput);
  }

  return '';
}

export async function runIssueWebhookAgent(input: IssueAgentInput): Promise<string | null> {
  if (!appConfig.openai.enabled) {
    return null;
  }

  if (!openaiClient) {
    console.warn('[OpenAI] OPENAI_ENABLED=true but OPENAI_API_KEY is missing');
    return null;
  }

  const prompt = [
    `Repository: ${input.repositoryFullName}`,
    `Issue title: ${input.issueTitle}`,
    `Issue body: ${input.issueBody || '(empty)'}`,
    'Return:',
    '1. A one-paragraph summary.',
    '2. A short implementation plan (3-5 steps).',
  ].join('\n');

  const response = await openaiClient.responses.create({
    model: appConfig.openai.model,
    instructions: appConfig.openai.issueWebhookInstructions,
    input: prompt,
  });

  const output = extractResponseText(response);

  if (!output) {
    console.warn('[OpenAI] Empty response text for webhook issue analysis');
    return null;
  }

  return output;
}
