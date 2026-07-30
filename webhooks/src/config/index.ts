import config from 'config';

export const appConfig = {
  port: config.get<number>('port'),
  authService: {
    url: config.get<string>('authService.url'),
  },
  github: {
    webhookSecret: config.get<string>('github.webhookSecret'),
  },
  serviceAuth: {
    secret: config.get<string>('serviceAuth.secret'),
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
    accessKeyId: config.get<string>('sqs.accessKeyId'),
    secretAccessKey: config.get<string>('sqs.secretAccessKey'),
  },
};
