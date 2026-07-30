import 'dotenv/config';
import app from './app';
import { appConfig } from './config';
import { ensureAllQueuesExist } from './connectors/sqs.connector';
import { logger, logError } from './logger';

async function start(): Promise<void> {
  await ensureAllQueuesExist();

  app.listen(appConfig.port, () => {
    logger.info(`Webhooks service running on port ${appConfig.port}`);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    logger.info('Shutting down webhooks service...');
    process.exit(0);
  });
}

start().catch((error: unknown) => {
  logError('Failed to start webhooks service', error);
  process.exit(1);
});
