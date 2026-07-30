"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyGithubWebhook = verifyGithubWebhook;
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
function isValidSignature(rawBody, signatureHeader) {
    if (!signatureHeader)
        return false;
    const expectedSignature = `sha256=${crypto_1.default
        .createHmac('sha256', config_1.appConfig.github.webhookSecret)
        .update(rawBody)
        .digest('hex')}`;
    const sigBuffer = Buffer.from(signatureHeader, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    if (sigBuffer.length !== expectedBuffer.length)
        return false;
    return crypto_1.default.timingSafeEqual(sigBuffer, expectedBuffer);
}
function verifyGithubWebhook(req, res, next) {
    const rawBody = req.body;
    const signature = req.get('x-hub-signature-256');
    if (!isValidSignature(rawBody, signature)) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
    }
    next();
}
