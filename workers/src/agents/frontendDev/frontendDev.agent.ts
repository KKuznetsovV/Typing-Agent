import { prepareDeveloperAgent } from '../shared/prepareDeveloperAgent';
import { runCodeGenerationAgent } from '../shared/runCodeGenerationAgent';
import { CodeGenerationResult } from '../shared/codeGeneration.schema';
import { DeveloperAgentInputBase } from '../shared/developerAgent.types';
import { FRONTEND_DEV_SYSTEM_PROMPT } from './frontendDev.prompt';

export async function runFrontendDevAgent(
  githubAccessToken: string,
  input: DeveloperAgentInputBase
): Promise<CodeGenerationResult> {
  const prepared = await prepareDeveloperAgent(githubAccessToken, 'frontend-dev', input);
  return runCodeGenerationAgent(
    'FrontendDev',
    FRONTEND_DEV_SYSTEM_PROMPT,
    'frontend_dev_code_generation',
    githubAccessToken,
    prepared
  );
}
