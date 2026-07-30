"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const config_1 = __importDefault(require("config"));
exports.appConfig = {
    port: config_1.default.get('port'),
    mongoUri: config_1.default.get('mongoUri'),
    jwt: {
        secret: config_1.default.get('jwt.secret'),
        expiresIn: config_1.default.get('jwt.expiresIn'),
    },
    github: {
        clientId: config_1.default.get('github.clientId'),
        clientSecret: config_1.default.get('github.clientSecret'),
        callbackUrl: config_1.default.get('github.callbackUrl'),
        webhookUrl: config_1.default.get('github.webhookUrl'),
        webhookSecret: config_1.default.get('github.webhookSecret'),
    },
    serviceAuth: {
        secret: config_1.default.get('serviceAuth.secret'),
    },
    frontend: {
        url: config_1.default.get('frontend.url'),
    },
    cors: {
        origin: config_1.default.get('cors.origin'),
    },
    logging: {
        level: config_1.default.get('logging.level'),
        serviceName: config_1.default.get('logging.serviceName'),
    },
};
