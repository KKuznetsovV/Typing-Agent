"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserIdByRepo = getUserIdByRepo;
const repoRegistration_service_1 = require("../services/repoRegistration.service");
async function getUserIdByRepo(req, res) {
    const repoOwner = req.params.repoOwner;
    const repoName = req.params.repoName;
    const userId = await (0, repoRegistration_service_1.findUserIdByRepo)(repoOwner, repoName);
    if (!userId) {
        res.status(404).json({ message: 'Repository not registered' });
        return;
    }
    res.json({ userId });
}
