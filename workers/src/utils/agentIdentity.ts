import { appConfig } from '../config';

export type AgentConfigKey = 'backendDev' | 'frontendDev' | 'devOps' | 'codeReviewer';

const AGENT_NAME_TO_CONFIG_KEY: Record<string, AgentConfigKey> = {
  BackendDev: 'backendDev',
  FrontendDev: 'frontendDev',
  DevOps: 'devOps',
  CodeReviewer: 'codeReviewer',
};

export interface AgentGitIdentity {
  name: string;
  email: string;
}

function toAgentSlug(agentName: string): string {
  return agentName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function getAgentConfigKey(agentName: string): AgentConfigKey | undefined {
  return AGENT_NAME_TO_CONFIG_KEY[agentName];
}

export function getAgentGitIdentity(agentName: string): AgentGitIdentity {
  const key = getAgentConfigKey(agentName);
  const agentConfig = key ? appConfig.github.agents[key] : undefined;
  return {
    name: agentConfig?.name || `TypingAgent-${agentName}`,
    email: agentConfig?.email || `${toAgentSlug(agentName)}@typing-agent.local`,
  };
}

export function resolveAgentGithubAccessToken(
  agentName: string,
  userAccessToken: string
): string {
  const key = getAgentConfigKey(agentName);
  const agentToken = key ? appConfig.github.agents[key].accessToken : '';
  return agentToken || userAccessToken;
}

export function hasAgentGithubAccessToken(agentName: string): boolean {
  const key = getAgentConfigKey(agentName);
  if (!key) return false;
  return Boolean(appConfig.github.agents[key].accessToken);
}
