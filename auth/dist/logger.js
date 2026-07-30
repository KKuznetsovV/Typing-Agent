"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logError = logError;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("./config");
const { combine, timestamp, colorize, printf, errors, json } = winston_1.default.format;
const consoleFormat = combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), printf(({ timestamp: ts, level, message, ...meta }) => {
    const metaKeys = Object.keys(meta).filter((k) => k !== 'service');
    const metaSuffix = metaKeys.length > 0
        ? ` ${JSON.stringify(Object.fromEntries(metaKeys.map((k) => [k, meta[k]])))}`
        : '';
    return `${String(ts)} ${level}: ${String(message)}${metaSuffix}`;
}));
exports.logger = winston_1.default.createLogger({
    level: config_1.appConfig.logging.level,
    defaultMeta: { service: config_1.appConfig.logging.serviceName },
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports: [
        new winston_1.default.transports.Console({ format: consoleFormat }),
    ],
});
function logError(message, error) {
    const serialized = error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
    exports.logger.error(message, { error: serialized });
}
