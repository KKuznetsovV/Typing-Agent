"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
const auth_service_1 = require("../services/auth.service");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined) ||
        req.cookies?.token;
    if (!token) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    try {
        req.user = (0, auth_service_1.verifyToken)(token);
        next();
    }
    catch {
        res.status(401).json({ message: 'Unauthorized' });
    }
}
