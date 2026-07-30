import { prepareDeveloperAgent } from '../shared/prepareDeveloperAgent';
import { runCodeGenerationAgent } from '../shared/runCodeGenerationAgent';
import { CodeGenerationResult } from '../shared/codeGeneration.schema';
import { DeveloperAgentInputBase } from '../shared/developerAgent.types';
import { DEVOPS_SYSTEM_PROMPT } from './devOps.prompt';

export async function runDevOpsAgent(
  githubAccessToken: string,
  input: DeveloperAgentInputBase
): Promise<CodeGenerationResult> {
  const prepared = await prepareDeveloperAgent(githubAccessToken, 'devops', input);
  return runCodeGenerationAgent(
    'DevOps',
    DEVOPS_SYSTEM_PROMPT,
    'devops_code_generation',
    githubAccessToken,
    prepared
  );
}
