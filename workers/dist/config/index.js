"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const config_1 = __importDefault(require("config"));
exports.appConfig = {
    authService: {
        url: config_1.default.get('authService.url'),
    },
    serviceAuth: {
        secret: config_1.default.get('serviceAuth.secret'),
    },
    openai: {
        apiKey: config_1.default.get('openai.apiKey'),
        model: config_1.default.get('openai.model'),
    },
    github: {
        agents: {
            backendDev: config_1.default.get('github.agents.backendDev'),
            frontendDev: config_1.default.get('github.agents.frontendDev'),
            devOps: config_1.default.get('github.agents.devOps'),
            codeReviewer: config_1.default.get('github.agents.codeReviewer'),
        },
    },
    logging: {
        level: config_1.default.get('logging.level'),
        serviceName: config_1.default.get('logging.serviceName'),
    },
    sqs: {
        region: config_1.default.get('sqs.region'),
        endpoint: config_1.default.get('sqs.endpoint'),
        queues: {
            techLead: config_1.default.get('sqs.queues.techLead'),
            backendDev: config_1.default.get('sqs.queues.backendDev'),
            frontendDev: config_1.default.get('sqs.queues.frontendDev'),
            devOps: config_1.default.get('sqs.queues.devOps'),
            codeReviewer: config_1.default.get('sqs.queues.codeReviewer'),
        },
        visibilityTimeoutSeconds: config_1.default.get('sqs.visibilityTimeoutSeconds'),
        waitTimeSeconds: config_1.default.get('sqs.waitTimeSeconds'),
        pollIntervalMs: config_1.default.get('sqs.pollIntervalMs'),
        accessKeyId: config_1.default.get('sqs.accessKeyId'),
        secretAccessKey: config_1.default.get('sqs.secretAccessKey'),
    },
};
