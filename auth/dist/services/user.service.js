"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrCreateFromGitHub = findOrCreateFromGitHub;
exports.findById = findById;
exports.findByIdWithAccessToken = findByIdWithAccessToken;
const User_1 = require("../models/User");
async function findOrCreateFromGitHub(profile, accessToken) {
    const githubId = profile.id;
    const email = profile.emails?.[0]?.value;
    const user = await User_1.User.findOneAndUpdate({ githubId }, {
        githubId,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
        email,
        githubAccessToken: accessToken,
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
    return user;
}
async function findById(id) {
    return User_1.User.findById(id);
}
async function findByIdWithAccessToken(id) {
    return User_1.User.findById(id).select('+githubAccessToken');
}
