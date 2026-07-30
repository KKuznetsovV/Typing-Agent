"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const config_1 = require("./config");
const db_connector_1 = require("./connectors/db.connector");
require("./passport");
const logger_1 = require("./logger");
async function start() {
    await (0, db_connector_1.connectDB)();
    app_1.default.listen(config_1.appConfig.port, () => {
        logger_1.logger.info(`Auth service running on port ${config_1.appConfig.port}`);
    });
}
for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        logger_1.logger.info('Shutting down auth service...');
        process.exit(0);
    });
}
start().catch((error) => {
    logger_1.logger.error('Failed to start auth service', { error });
    process.exit(1);
});
