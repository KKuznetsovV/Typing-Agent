"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceAuthHeaders = createServiceAuthHeaders;
const crypto_1 = __importDefault(require("crypto"));
const HMAC_ALGORITHM = 'sha256';
const SERVICE_NONCE_HEADER = 'x-service-nonce';
function signServiceNonce(nonce, secret) {
    return crypto_1.default.createHmac(HMAC_ALGORITHM, secret).update(nonce).digest('hex');
}
function createServiceAuthHeaders(secret) {
    const nonce = crypto_1.default.randomUUID();
    const signature = signServiceNonce(nonce, secret);
    return {
        [SERVICE_NONCE_HEADER]: nonce,
        Authorization: `Bearer ${signature}`,
    };
}
