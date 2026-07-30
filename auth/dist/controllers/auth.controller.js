"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGitHubCallback = handleGitHubCallback;
exports.logout = logout;
const config_1 = require("../config");
const auth_service_1 = require("../services/auth.service");
const github_service_1 = require("../services/github.service");
const logger_1 = require("../logger");
function handleGitHubCallback(req, res) {
    const user = req.user;
    const token = (0, auth_service_1.signToken)(user._id.toString());
    res.redirect(`${config_1.appConfig.frontend.url}?token=${token}`);
    if (user.githubAccessToken) {
        (0, github_service_1.registerWebhooksForUser)(user.githubAccessToken, user._id.toString()).catch((error) => {
            (0, logger_1.logError)('Failed to register webhooks after GitHub login', error);
        });
    }
}
function logout(_req, res) {
    res.clearCookie('token');
    res.json({ success: true });
}
