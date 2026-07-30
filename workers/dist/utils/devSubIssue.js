"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDevAgentSubIssueForParent = isDevAgentSubIssueForParent;
const techLead_types_1 = require("../agents/techLead/techLead.types");
const DEV_AGENT_TITLE_PATTERN = new RegExp(`\\[(?:${Object.values(techLead_types_1.TECH_LEAD_AGENT_MARKERS)
    .map((marker) => marker.slice(1, -1))
    .join('|')})\\]`, 'i');
const PARENT_ISSUE_BODY_PATTERN = /^Derived from parent issue #(\d+)\./m;
function isDevAgentSubIssueForParent(title, body, parentIssueNumber) {
    if (!DEV_AGENT_TITLE_PATTERN.test(title) || !body)
        return false;
    const match = body.match(PARENT_ISSUE_BODY_PATTERN);
    if (!match)
        return false;
    return Number(match[1]) === parentIssueNumber;
}
