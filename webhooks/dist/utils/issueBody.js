"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTargetBranchFromIssueBody = parseTargetBranchFromIssueBody;
function parseTargetBranchFromIssueBody(body) {
    const match = body.match(/^Target branch:\s*(.+)$/m);
    return match?.[1]?.trim() ?? null;
}
