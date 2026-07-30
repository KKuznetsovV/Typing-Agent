"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const sqs_connector_1 = require("./connectors/sqs.connector");
const config_1 = require("./config");
const logger_1 = require("./logger");
const backendDev_worker_1 = require("./workers/backendDev.worker");
const codeReviewer_worker_1 = require("./workers/codeReviewer.worker");
const devOps_worker_1 = require("./workers/devOps.worker");
const frontendDev_worker_1 = require("./workers/frontendDev.worker");
const techLead_worker_1 = require("./workers/techLead.worker");
const WORKER_FACTORIES = {
    techLead: techLead_worker_1.createTechLeadWorker,
    backendDev: backendDev_worker_1.createBackendDevWorker,
    frontendDev: frontendDev_worker_1.createFrontendDevWorker,
    devOps: devOps_worker_1.createDevOpsWorker,
    codeReviewer: codeReviewer_worker_1.createCodeReviewerWorker,
};
async function start() {
    const workerType = (process.env.WORKER_TYPE ?? 'techLead');
    const createWorker = WORKER_FACTORIES[workerType];
    if (!createWorker) {
        throw new Error(`Unknown WORKER_TYPE: ${workerType}`);
    }
    const queueName = config_1.appConfig.sqs.queues[workerType];
    await (0, sqs_connector_1.ensureQueueExists)(queueName);
    const worker = createWorker();
    for (const signal of ['SIGINT', 'SIGTERM']) {
        process.on(signal, () => {
            logger_1.logger.info(`Received ${signal}, stopping worker...`);
            worker.stop();
            process.exit(0);
        });
    }
    worker.start();
}
start().catch((error) => {
    (0, logger_1.logError)('Failed to start worker', error);
    process.exit(1);
});
