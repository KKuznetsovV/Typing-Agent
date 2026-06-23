import config from 'config';

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
}

export const appConfig = {
  port: config.get<number>('port'),
  mongoUri: config.get<string>('mongoUri'),
  jwt: {
    secret: config.get<string>('jwt.secret'),
    expiresIn: config.get<string>('jwt.expiresIn'),
  },
  github: {
    clientId: config.get<string>('github.clientId'),
    clientSecret: config.get<string>('github.clientSecret'),
    callbackUrl: config.get<string>('github.callbackUrl'),
    webhookUrl: config.get<string>('github.webhookUrl'),
    webhookSecret: config.get<string>('github.webhookSecret'),
  },
  frontend: {
    url: config.get<string>('frontend.url'),
  },
  cors: {
    origin: config.get<string>('cors.origin'),
  },
  openai: {
    enabled: toBoolean(config.get<boolean | string>('openai.enabled')),
    apiKey: config.get<string>('openai.apiKey'),
    model: config.get<string>('openai.model'),
    issueWebhookInstructions: config.get<string>('openai.issueWebhookInstructions'),
  },
};
