"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpenAIClient = getOpenAIClient;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
let client = null;
function getOpenAIClient() {
    if (!client) {
        if (!config_1.appConfig.openai.apiKey) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        client = new openai_1.default({ apiKey: config_1.appConfig.openai.apiKey });
    }
    return client;
}
