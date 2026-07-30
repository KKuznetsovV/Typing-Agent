"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const repo_routes_1 = __importDefault(require("./repo.routes"));
const router = (0, express_1.Router)();
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'auth' });
});
router.use('/auth', auth_routes_1.default);
router.use('/user', user_routes_1.default);
router.use('/repos', repo_routes_1.default);
exports.default = router;
