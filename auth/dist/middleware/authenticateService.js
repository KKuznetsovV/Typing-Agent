"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateService = authenticateService;
const config_1 = require("../config");
const serviceAuth_1 = require("../utils/serviceAuth");
const SERVICE_NONCE_HEADER = 'x-service-nonce';
function authenticateService(req, res, next) {
    const secret = config_1.appConfig.serviceAuth.secret;
    if (!secret) {
        res.status(500).json({ message: 'Service authentication is not configured' });
        return;
    }
    const nonce = req.header(SERVICE_NONCE_HEADER);
    const authHeader = req.headers.authorization;
    if (!nonce || !authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const signature = authHeader.slice('Bearer '.length).trim();
    if (!(0, serviceAuth_1.verifyServiceAuth)(nonce, signature, secret)) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    next();
}
