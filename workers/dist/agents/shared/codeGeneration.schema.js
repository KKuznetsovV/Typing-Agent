"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_GENERATION_RESPONSE_SCHEMA = exports.CODE_FILE_SCHEMA = exports.CODE_GENERATION_SHARED_RULES = void 0;
exports.CODE_GENERATION_SHARED_RULES = `Repository context:
- The user message includes "Repository files" — a JSON array of { path, content } objects from the work branch.
- Read existing code carefully before proposing changes. Match project conventions, imports, and structure.

Output format (used to commit and open a pull request on GitHub):
- Return only the JSON object matching the provided schema.
- commitMessage: a concise conventional commit message for the code changes.
- prTitle: a clear pull request title summarizing the change.
- prBody: a pull request description explaining what changed, why, and how to verify. Reference the issue number when relevant.
- files: only the files you create or modify. Each entry must contain the full final file content (path includes directories and extension). Unlisted files are left unchanged when the commit is applied.
- Do not include explanations outside the JSON.`;
exports.CODE_FILE_SCHEMA = {
    type: 'object',
    properties: {
        path: { type: 'string', minLength: 1 },
        content: { type: 'string' },
    },
    required: ['path', 'content'],
    additionalProperties: false,
};
exports.CODE_GENERATION_RESPONSE_SCHEMA = {
    type: 'object',
    properties: {
        commitMessage: { type: 'string', minLength: 1 },
        prTitle: { type: 'string', minLength: 1 },
        prBody: { type: 'string', minLength: 1 },
        files: {
            type: 'array',
            items: exports.CODE_FILE_SCHEMA,
        },
    },
    required: ['commitMessage', 'prTitle', 'prBody', 'files'],
    additionalProperties: false,
};
