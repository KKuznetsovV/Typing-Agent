import { prepareDeveloperAgent } from '../shared/prepareDeveloperAgent';
import { runCodeGenerationAgent } from '../shared/runCodeGenerationAgent';
import { CodeGenerationResult } from '../shared/codeGeneration.schema';
import { DeveloperAgentInputBase } from '../shared/developerAgent.types';
import { BACKEND_DEV_SYSTEM_PROMPT } from './backendDev.prompt';

export async function runBackendDevAgent(
  githubAccessToken: string,
  input: DeveloperAgentInputBase
): Promise<CodeGenerationResult> {
  const prepared = await prepareDeveloperAgent(githubAccessToken, 'backend-dev', input);
  return runCodeGenerationAgent(
    'BackendDev',
    BACKEND_DEV_SYSTEM_PROMPT,
    'backend_dev_code_generation',
    githubAccessToken,
    prepared
  );
}
