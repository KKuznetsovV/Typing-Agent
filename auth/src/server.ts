import 'dotenv/config';
import app from './app';
import { appConfig } from './config';
import { connectDB } from './connectors/db.connector';
import './passport';
import { logger } from './logger';

async function start(): Promise<void> {
  await connectDB();

  app.listen(appConfig.port, () => {
    logger.info(`Auth service running on port ${appConfig.port}`);
  });
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    logger.info('Shutting down auth service...');
    process.exit(0);
  });
}

start().catch((error: unknown) => {
  logger.error('Failed to start auth service', { error });
  process.exit(1);
});
