"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTechLeadAgent = runTechLeadAgent;
const openai_connector_1 = require("../../connectors/openai.connector");
const config_1 = require("../../config");
const github_service_1 = require("../../services/github.service");
const branchName_1 = require("../../utils/branchName");
const techLead_prompt_1 = require("./techLead.prompt");
const techLead_types_1 = require("./techLead.types");
const AGENT_TASK_FIELDS = [
    { agent: 'BackendDev', field: 'backendDev' },
    { agent: 'FrontendDev', field: 'frontendDev' },
    { agent: 'DevOps', field: 'devOps' },
];
function buildIssueTitle(agent, taskTitle) {
    return `${techLead_types_1.TECH_LEAD_AGENT_MARKERS[agent]} ${taskTitle}`;
}
function buildIssueBody(task, input) {
    const parentRef = input.parentIssueNumber
        ? `Derived from parent issue #${input.parentIssueNumber}.\n`
        : `Derived from parent issue: ${input.issueTitle}\n`;
    return `${parentRef}Target branch: ${input.branchName}\n\n${task.body}`;
}
function buildUserMessage(input) {
    return [
        `Repository: ${input.repoOwner}/${input.repoName}`,
        input.parentIssueNumber ? `Parent issue number: #${input.parentIssueNumber}` : null,
        `Parent issue title: ${input.issueTitle}`,
        'Parent issue body:',
        input.issueBody || '(empty)',
    ]
        .filter(Boolean)
        .join('\n');
}
async function planTasks(input) {
    const openai = (0, openai_connector_1.getOpenAIClient)();
    const response = await openai.responses.create({
        model: config_1.appConfig.openai.model,
        instructions: techLead_prompt_1.TECH_LEAD_SYSTEM_PROMPT,
        input: buildUserMessage(input),
        text: {
            format: {
                type: 'json_schema',
                name: 'tech_lead_task_plan',
                strict: true,
                schema: techLead_prompt_1.TECH_LEAD_TASK_PLAN_SCHEMA,
            },
        },
    });
    const responseText = response.output_text;
    if (!responseText)
        throw new Error('TechLead received empty response from OpenAI');
    return {
        plan: JSON.parse(responseText),
        openaiResponseId: response.id,
    };
}
async function createSubIssues(input, plan) {
    const createdIssues = [];
    for (const { agent, field } of AGENT_TASK_FIELDS) {
        const task = plan[field];
        if (!task)
            continue;
        const title = buildIssueTitle(agent, task.title);
        const body = buildIssueBody(task, input);
        const issue = await (0, github_service_1.createIssue)(input.githubAccessToken, input.repoOwner, input.repoName, title, body);
        createdIssues.push({ agent, issueNumber: issue.number, url: issue.html_url, title });
    }
    return createdIssues;
}
async function runTechLeadAgent(input) {
    if (!input.parentIssueNumber) {
        throw new Error('TechLead agent requires parentIssueNumber');
    }
    const branchName = (0, branchName_1.buildFeatureBranchName)(input.parentIssueNumber, input.issueTitle);
    await (0, github_service_1.createFeatureBranch)(input.githubAccessToken, input.repoOwner, input.repoName, branchName);
    const inputWithBranch = { ...input, branchName };
    const { plan, openaiResponseId } = await planTasks(inputWithBranch);
    const createdIssues = await createSubIssues(inputWithBranch, plan);
    return { plan, createdIssues, openaiResponseId, branchName };
}
