"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchUserById = fetchUserById;
const config_1 = require("../config");
const serviceAuth_1 = require("../utils/serviceAuth");
async function fetchUserById(userId) {
    const secret = config_1.appConfig.serviceAuth.secret;
    const response = await fetch(`${config_1.appConfig.authService.url}/api/user/${encodeURIComponent(userId)}`, { headers: (0, serviceAuth_1.createServiceAuthHeaders)(secret) });
    if (response.status === 404)
        return null;
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Auth user API failed (${response.status}): ${text}`);
    }
    return response.json();
}
