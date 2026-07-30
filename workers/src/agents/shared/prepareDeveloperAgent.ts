import { logger } from '../../logger';
import { createBranchFromBase } from '../../services/github.service';
import { buildDeveloperBranchName, DeveloperAgentRole } from '../../utils/branchName';
import { DeveloperAgentInput, DeveloperAgentInputBase } from './developerAgent.types';

export async function prepareDeveloperAgent(
  githubAccessToken: string,
  agentRole: DeveloperAgentRole,
  input: DeveloperAgentInputBase
): Promise<DeveloperAgentInput> {
  const workBranchName = buildDeveloperBranchName(
    input.branchName,
    agentRole,
    input.issueNumber
  );

  await createBranchFromBase(
    githubAccessToken,
    input.repoOwner,
    input.repoName,
    workBranchName,
    input.branchName
  );

  logger.info(`[${agentRole}] Created work branch ${workBranchName} from ${input.branchName}`);

  return { ...input, workBranchName };
}
