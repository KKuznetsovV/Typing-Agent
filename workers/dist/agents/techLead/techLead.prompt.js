"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TECH_LEAD_TASK_PLAN_SCHEMA = exports.TECH_LEAD_SYSTEM_PROMPT = void 0;
exports.TECH_LEAD_SYSTEM_PROMPT = `You are TechLead, a senior engineering lead agent in the TypingAgent system.

Your job is to read a human-written GitHub issue and decompose it into actionable work for specialized agents. You may assign work to up to three agents:

- BackendDev — server-side logic, APIs, databases, authentication, business rules, integrations
- FrontendDev — UI, UX, client-side state, forms, styling, accessibility, browser behavior
- DevOps — CI/CD, Docker, deployment, infrastructure, monitoring, secrets, environment configuration

Rules:
1. Only create tasks that are clearly needed based on the parent issue. If an agent has no relevant work, set that field to null.
2. Create at most one task per agent (up to 3 issues total).
3. Each task must be self-contained: another agent should understand what to do without reading the parent issue.
4. Reference concrete deliverables, acceptance criteria, and dependencies between tasks when relevant.
5. Do not invent requirements that are not implied or stated in the parent issue.
6. Prefer concise, implementation-ready titles and detailed bodies with bullet points for requirements and acceptance criteria.
7. If the parent issue is only about one area (e.g. only UI), only assign FrontendDev and leave others null.

Output JSON only, matching the provided schema. Task titles must NOT include agent markers — those are added automatically when issues are created on GitHub.`;
exports.TECH_LEAD_TASK_PLAN_SCHEMA = {
    type: 'object',
    properties: {
        backendDev: {
            anyOf: [
                {
                    type: 'object',
                    properties: {
                        title: { type: 'string', minLength: 1 },
                        body: { type: 'string', minLength: 1 },
                    },
                    required: ['title', 'body'],
                    additionalProperties: false,
                },
                { type: 'null' },
            ],
        },
        frontendDev: {
            anyOf: [
                {
                    type: 'object',
                    properties: {
                        title: { type: 'string', minLength: 1 },
                        body: { type: 'string', minLength: 1 },
                    },
                    required: ['title', 'body'],
                    additionalProperties: false,
                },
                { type: 'null' },
            ],
        },
        devOps: {
            anyOf: [
                {
                    type: 'object',
                    properties: {
                        title: { type: 'string', minLength: 1 },
                        body: { type: 'string', minLength: 1 },
                    },
                    required: ['title', 'body'],
                    additionalProperties: false,
                },
                { type: 'null' },
            ],
        },
    },
    required: ['backendDev', 'frontendDev', 'devOps'],
    additionalProperties: false,
};
