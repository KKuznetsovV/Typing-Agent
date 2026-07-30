"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = getMe;
exports.getUserById = getUserById;
const user_service_1 = require("../services/user.service");
async function getMe(req, res) {
    const user = await (0, user_service_1.findById)(req.user.sub);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json({
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
    });
}
/** Internal endpoint — called by other services via service auth. */
async function getUserById(req, res) {
    const userId = req.params.userId;
    const user = await (0, user_service_1.findByIdWithAccessToken)(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
    }
    res.json({
        id: user._id,
        githubId: user.githubId,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        email: user.email,
        githubAccessToken: user.githubAccessToken,
    });
}
