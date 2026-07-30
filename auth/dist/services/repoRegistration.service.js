"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertRepoRegistration = upsertRepoRegistration;
exports.findUserIdByRepo = findUserIdByRepo;
const RepoRegistration_1 = require("../models/RepoRegistration");
async function upsertRepoRegistration(userId, repoOwner, repoName) {
    await RepoRegistration_1.RepoRegistration.findOneAndUpdate({ repoOwner, repoName }, { userId, repoOwner, repoName }, { upsert: true, setDefaultsOnInsert: true });
}
async function findUserIdByRepo(repoOwner, repoName) {
    const registration = await RepoRegistration_1.RepoRegistration.findOne({ repoOwner, repoName });
    return registration ? registration.userId.toString() : null;
}
