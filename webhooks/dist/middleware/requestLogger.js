"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../logger");
function requestLogger(req, _res, next) {
    logger_1.logger.info(`${req.method} ${req.path}`);
    next();
}
