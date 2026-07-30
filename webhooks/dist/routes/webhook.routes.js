"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const verifyGithubWebhook_1 = require("../middleware/verifyGithubWebhook");
const router = (0, express_1.Router)();
router.post('/', verifyGithubWebhook_1.verifyGithubWebhook, webhook_controller_1.handleGithubWebhook);
exports.default = router;
