"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const app = (0, express_1.default)();
app.use(requestLogger_1.requestLogger);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'webhooks' });
});
app.use('/api/webhooks/github', express_1.default.raw({ type: 'application/json' }), webhook_routes_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
