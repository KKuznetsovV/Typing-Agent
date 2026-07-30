"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const sqs_connector_1 = require("./connectors/sqs.connector");
const logger_1 = require("./logger");
async function start() {
    await (0, sqs_connector_1.ensureAllQueuesExist)();
    app_1.default.listen(config_1.appConfig.port, () => {
        logger_1.logger.info(`Webhooks service running on port ${config_1.appConfig.port}`);
    });
}
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        logger_1.logger.info('Shutting down webhooks service...');
        process.exit(0);
    });
}
start().catch((error) => {
    (0, logger_1.logError)('Failed to start webhooks service', error);
    process.exit(1);
});
