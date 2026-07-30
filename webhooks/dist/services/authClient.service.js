"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUserIdByRepo = fetchUserIdByRepo;
const config_1 = require("../config");
const serviceAuth_1 = require("../utils/serviceAuth");
async function fetchUserIdByRepo(repoOwner, repoName) {
    const secret = config_1.appConfig.serviceAuth.secret;
    const response = await fetch(`${config_1.appConfig.authService.url}/api/repos/${encodeURIComponent(repoOwner)}/${encodeURIComponent(repoName)}/user-id`, { headers: (0, serviceAuth_1.createServiceAuthHeaders)(secret) });
    if (response.status === 404)
        return null;
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Auth repo lookup failed (${response.status}): ${text}`);
    }
    const data = (await response.json());
    return data.userId;
}
