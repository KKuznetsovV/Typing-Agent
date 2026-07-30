"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_github2_1 = require("passport-github2");
const config_1 = require("../config");
const github_service_1 = require("../services/github.service");
const user_service_1 = require("../services/user.service");
const logger_1 = require("../logger");
passport_1.default.use(new passport_github2_1.Strategy({
    clientID: config_1.appConfig.github.clientId,
    clientSecret: config_1.appConfig.github.clientSecret,
    callbackURL: config_1.appConfig.github.callbackUrl,
    scope: ['user:email', 'repo', 'admin:repo_hook'],
}, async (accessToken, _refreshToken, profile, done) => {
    try {
        const user = await (0, user_service_1.findOrCreateFromGitHub)(profile, accessToken);
        (0, github_service_1.registerWebhooksForUser)(accessToken, user._id.toString()).catch((error) => {
            (0, logger_1.logError)('Failed to register webhooks after OAuth', error);
        });
        done(null, user);
    }
    catch (error) {
        done(error);
    }
}));
exports.default = passport_1.default;
