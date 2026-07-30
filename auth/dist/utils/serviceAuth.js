"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signServiceNonce = signServiceNonce;
exports.verifyServiceAuth = verifyServiceAuth;
const crypto_1 = __importDefault(require("crypto"));
const HMAC_ALGORITHM = 'sha256';
function signServiceNonce(nonce, secret) {
    return crypto_1.default.createHmac(HMAC_ALGORITHM, secret).update(nonce).digest('hex');
}
function verifyServiceAuth(nonce, signature, secret) {
    if (!nonce || !signature || !secret)
        return false;
    const expected = signServiceNonce(nonce, secret);
    if (expected.length !== signature.length)
        return false;
    return crypto_1.default.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
