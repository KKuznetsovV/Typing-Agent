import config from 'config';

interface AgentConfig {
  name: string;
  email: string;
  accessToken: string;
}

export const appConfig = {
  authService: {
    url: config.get<string>('authService.url'),
  },
  serviceAuth: {
    secret: config.get<string>('serviceAuth.secret'),
  },
  openai: {
    apiKey: config.get<string>('openai.apiKey'),
    model: config.get<string>('openai.model'),
  },
  github: {
    agents: {
      backendDev: config.get<AgentConfig>('github.agents.backendDev'),
      frontendDev: config.get<AgentConfig>('github.agents.frontendDev'),
      devOps: config.get<AgentConfig>('github.agents.devOps'),
      codeReviewer: config.get<AgentConfig>('github.agents.codeReviewer'),
    },
  },
  logging: {
    level: config.get<string>('logging.level'),
    serviceName: config.get<string>('logging.serviceName'),
  },
  sqs: {
    region: config.get<string>('sqs.region'),
    endpoint: config.get<string>('sqs.endpoint'),
    queues: {
      techLead: config.get<string>('sqs.queues.techLead'),
      backendDev: config.get<string>('sqs.queues.backendDev'),
      frontendDev: config.get<string>('sqs.queues.frontendDev'),
      devOps: config.get<string>('sqs.queues.devOps'),
      codeReviewer: config.get<string>('sqs.queues.codeReviewer'),
    },
    visibilityTimeoutSeconds: config.get<number>('sqs.visibilityTimeoutSeconds'),
    waitTimeSeconds: config.get<number>('sqs.waitTimeSeconds'),
    pollIntervalMs: config.get<number>('sqs.pollIntervalMs'),
    accessKeyId: config.get<string>('sqs.accessKeyId'),
    secretAccessKey: config.get<string>('sqs.secretAccessKey'),
  },
};
