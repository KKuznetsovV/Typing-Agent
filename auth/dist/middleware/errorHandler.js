"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../logger");
const errorHandler = (err, _req, res, _next) => {
    const status = err.status
        ?? err.statusCode
        ?? 500;
    const message = err.message ?? 'Internal server error';
    (0, logger_1.logError)('Unhandled error', err);
    res.status(status).json({ message });
};
exports.errorHandler = errorHandler;
