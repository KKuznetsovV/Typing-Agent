import 'dotenv/config';
import { ensureQueueExists } from './connectors/sqs.connector';
import { appConfig } from './config';
import { logError, logger } from './logger';
import { createBackendDevWorker } from './workers/backendDev.worker';
import { createCodeReviewerWorker } from './workers/codeReviewer.worker';
import { createDevOpsWorker } from './workers/devOps.worker';
import { createFrontendDevWorker } from './workers/frontendDev.worker';
import { createTechLeadWorker } from './workers/techLead.worker';

type WorkerType = 'techLead' | 'backendDev' | 'frontendDev' | 'devOps' | 'codeReviewer';

const WORKER_FACTORIES: Record<WorkerType, () => { start: () => void; stop: () => void }> = {
  techLead: createTechLeadWorker,
  backendDev: createBackendDevWorker,
  frontendDev: createFrontendDevWorker,
  devOps: createDevOpsWorker,
  codeReviewer: createCodeReviewerWorker,
};

async function start(): Promise<void> {
  const workerType = (process.env.WORKER_TYPE ?? 'techLead') as WorkerType;

  const createWorker = WORKER_FACTORIES[workerType];
  if (!createWorker) {
    throw new Error(`Unknown WORKER_TYPE: ${workerType}`);
  }

  const queueName = appConfig.sqs.queues[workerType];
  await ensureQueueExists(queueName);

  const worker = createWorker();

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      logger.info(`Received ${signal}, stopping worker...`);
      worker.stop();
      process.exit(0);
    });
  }

  worker.start();
}

start().catch((error: unknown) => {
  logError('Failed to start worker', error);
  process.exit(1);
});
