import OpenAI from 'openai';
import { appConfig } from '../config';

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    if (!appConfig.openai.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    client = new OpenAI({ apiKey: appConfig.openai.apiKey });
  }
  return client;
}
