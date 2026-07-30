"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueAgentJob = enqueueAgentJob;
const sqs_connector_1 = require("../connectors/sqs.connector");
const logger_1 = require("../logger");
const config_1 = require("../config");
function getQueueName(route) {
    return config_1.appConfig.sqs.queues[route];
}
async function enqueueAgentJob(route, message) {
    const queueName = getQueueName(route);
    const messageId = await (0, sqs_connector_1.sendQueueMessage)(queueName, JSON.stringify(message));
    logger_1.logger.info(`[queue] Enqueued ${route} job to ${queueName} (messageId=${messageId ?? 'unknown'}) ` +
        `for ${message.repoOwner}/${message.repoName} issue #${message.issueNumber}`);
}
