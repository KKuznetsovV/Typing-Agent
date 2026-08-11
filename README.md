# TypingAgent

TypingAgent is a self-hosted, multi-agent AI development team that lives on top of your GitHub repos. Sign in with GitHub, open an issue titled `[TypingAgent] <feature description>` on one of your admin repos, and a crew of AI agents will decompose the work, write the code, open pull requests, and review/merge them — all through the normal GitHub issue/PR flow.

## How it works

1. You sign in with GitHub on the web frontend. This registers a TypingAgent webhook on every repo you administer.
2. You open an issue titled `[TypingAgent] <feature description>` on a registered repo.
3. The **TechLead** agent reads the issue, creates a feature branch, and decomposes the work into sub-issues tagged `[TypingAgent-BackendDev]`, `[TypingAgent-FrontendDev]`, and/or `[TypingAgent-DevOps]`.
4. Each specialist agent (**BackendDev**, **FrontendDev**, **DevOps**) picks up its sub-issue, generates the code, commits it to the feature branch, and opens a pull request tagged `[TypingAgent-CodeReviewer]`.
5. The **CodeReviewer** agent reviews the PR's diff and either merges it or requests changes.

All coordination between GitHub webhook events and agents happens asynchronously over SQS queues, so multiple issues/PRs can be processed in parallel.

## Architecture

```
┌──────────────┐   OAuth login    ┌─────────────┐
│   Frontend   │◄────────────────►│   GitHub    │
│ React (Vite) │                  └──────┬──────┘
│    :5173     │                         │ webhook (issues, pull_request)
└──────┬───────┘                         ▼
       │ REST (JWT)               ┌─────────────┐
       ▼                          │  Webhooks   │
┌──────────────┐  service token   │   :3001     │
│     Auth     │◄─────────────────┤ (routes to  │
│  Express/TS  │                  │  SQS queues)│
│    :3000     │                  └──────┬──────┘
│  MongoDB     │                         │
└──────────────┘                         ▼
                                   ┌─────────────┐
                                   │  SQS queues │
                                   │ (LocalStack)│
                                   └──────┬──────┘
                                          ▼
                     ┌────────────────────────────────────────┐
                     │                Workers                 │
                     │  TechLead · BackendDev · FrontendDev ·  │
                     │       DevOps · CodeReviewer             │
                     │  (OpenAI-powered agents, one per queue) │
                     └────────────────────────────────────────┘
```

**Services:**

| Service    | Path         | Port | Responsibility                                                                 |
|------------|--------------|------|---------------------------------------------------------------------------------|
| `frontend` | `frontend/`  | 5173 | React/Vite SPA — GitHub login and welcome/dashboard screens.                    |
| `auth`     | `auth/`      | 3000 | GitHub OAuth, JWT issuance, user + repo-registration storage (MongoDB), registers the TypingAgent webhook on the user's repos. |
| `webhooks` | `webhooks/`  | 3001 | Verifies and receives GitHub webhook deliveries, routes `issues`/`pull_request` events to the correct SQS queue. |
| `workers`  | `workers/`   | —    | Long-running consumers, one process per agent type, that poll SQS and run OpenAI-powered agents against GitHub. |
| `mongodb`  | (Docker)     | 27017| Stores users and repo registrations.                                            |
| `localstack`| (Docker)    | 4566 | Local SQS emulation for the job queues.                                         |

## Agents

Each agent is an OpenAI-powered worker (`workers/src/agents/<agent>`) with a dedicated system prompt and SQS queue:

| Agent          | Queue                  | Role                                                                 |
|----------------|-------------------------|-----------------------------------------------------------------------|
| `techLead`     | `tech-lead-queue`       | Reads the parent issue, creates the feature branch, and decomposes work into BackendDev/FrontendDev/DevOps sub-issues. |
| `backendDev`   | `backend-dev-queue`     | Implements backend/API/server-side code changes.                     |
| `frontendDev`  | `frontend-dev-queue`    | Implements React/TypeScript frontend changes.                        |
| `devOps`       | `devops-queue`          | Implements Docker, CI/CD, and infrastructure changes.                |
| `codeReviewer` | `code-reviewer-queue`   | Reviews open pull requests' diffs and merges or requests changes.     |

Agents can commit as the authenticated user or as a dedicated bot account (see `GITHUB_AGENT_*_TOKEN` env vars below).

## Tech stack

- **Frontend:** React 19, Vite, TypeScript
- **Auth service:** Express 5, TypeScript, MongoDB/Mongoose, Passport (`passport-github2`), JWT, Joi, `node-config`, Winston
- **Webhooks service:** Express 5, TypeScript, `@aws-sdk/client-sqs`, `node-config`, Winston
- **Workers:** TypeScript, OpenAI SDK, `@aws-sdk/client-sqs`, `node-config`, Winston
- **Infrastructure:** Docker Compose, MongoDB, LocalStack (SQS emulation), Nginx (frontend container)

## Project structure

```
Typing-Agent/
├── docker-compose.yml       # Orchestrates all services
├── plan.md                  # Original build plan / design doc
├── workflow.md              # Credential setup & end-to-end usage walkthrough
├── auth/                    # OAuth, JWT, users & repo registrations (MongoDB)
│   └── src/{controllers,services,routes,models,passport,middleware}
├── webhooks/                # GitHub webhook receiver → SQS router
│   └── src/{controllers,queues,routes,middleware}
├── workers/                 # SQS consumers running the AI agents
│   └── src/{agents,workers,queues,services,connectors}
└── frontend/                # React/Vite SPA (login + welcome screens)
    └── src/{components,context,api}
```

## Getting started

### Prerequisites

- Docker and Docker Compose
- A GitHub account (and a repo you administer, to test against)
- An OpenAI API key
- [ngrok](https://ngrok.com/) (or similar) for exposing the webhooks service publicly during local development

### 1. Create a GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Homepage URL: `http://localhost:5173`
3. Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy the **Client ID** → `GITHUB_CLIENT_ID` and generate a **Client secret** → `GITHUB_CLIENT_SECRET`.

### 2. Generate a webhook secret

```bash
openssl rand -hex 32   # → GITHUB_WEBHOOK_SECRET
```

### 3. Expose the webhooks service publicly (local dev)

Start ngrok on port 3001 and copy the HTTPS URL into `GITHUB_WEBHOOK_URL=https://<your-ngrok-url>/api/webhooks/github`. The auth service registers this URL as a webhook on every admin repo you log in with.

### 4. Get an OpenAI API key

platform.openai.com → **API keys → Create new secret key** → `OPENAI_API_KEY`.

### 5. Generate the shared secrets

```bash
openssl rand -hex 32   # → JWT_SECRET
openssl rand -hex 32   # → SERVICE_AUTH_SECRET
```

`SERVICE_AUTH_SECRET` must be identical across `auth`, `webhooks`, and `workers` — it authenticates their internal service-to-service calls.

### 6. (Optional) Dedicated bot accounts

By default, agents commit and open PRs using your own OAuth token. To attribute commits to bot accounts instead, create fine-grained GitHub PATs (with `Contents: write` and `Pull requests: write` on the target repos) and set:

```
GITHUB_AGENT_BACKEND_DEV_TOKEN
GITHUB_AGENT_FRONTEND_DEV_TOKEN
GITHUB_AGENT_DEVOPS_TOKEN
GITHUB_AGENT_CODE_REVIEWER_TOKEN
```

### 7. Configure environment

```bash
cp .env.example .env
# then fill in the values from steps 1-6
```

### 8. Start everything

```bash
docker compose up -d --build
```

This starts MongoDB, LocalStack, `auth` (:3000), `webhooks` (:3001), the five `worker-*` processes, and `frontend` (:5173).

### 9. Try it out

1. Open [http://localhost:5173](http://localhost:5173) and sign in with GitHub. This registers the TypingAgent webhook on all your admin repos.
2. On a registered repo, create an issue titled `[TypingAgent] <your feature description>`.
3. The TechLead agent decomposes it into sub-issues for BackendDev, FrontendDev, and/or DevOps.
4. Each sub-agent reads its issue, writes code, and opens a PR tagged `[TypingAgent-CodeReviewer]`.
5. The CodeReviewer agent reviews and merges the PR (or requests changes).

## Environment variables

| Variable | Used by | Description |
|---|---|---|
| `JWT_SECRET` | auth | Signs user session JWTs |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | auth | GitHub OAuth App credentials |
| `GITHUB_CALLBACK_URL` | auth | OAuth callback URL |
| `GITHUB_WEBHOOK_URL` | auth | Public URL the webhooks service is reachable at |
| `GITHUB_WEBHOOK_SECRET` | auth, webhooks | Verifies inbound GitHub webhook signatures |
| `SERVICE_AUTH_SECRET` | auth, webhooks, workers | Shared secret for internal service-to-service auth |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | workers | OpenAI credentials/model used by all agents |
| `FRONTEND_URL` / `CORS_ORIGIN` | auth | Where the frontend is served from |
| `VITE_API_URL` | frontend (build arg) | Base URL the SPA uses to call the auth API |
| `SQS_REGION`, `SQS_ENDPOINT`, `SQS_QUEUE_*` | webhooks, workers | LocalStack/SQS connection and queue names |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | webhooks, workers | Dummy credentials for LocalStack |
| `GITHUB_AGENT_*_TOKEN` | workers | Optional per-agent bot PATs (falls back to the user's OAuth token) |

See [.env.example](.env.example) for the full list with defaults.

## Key API routes

**Auth service (`:3000/api`)**
| Method | Path | Description |
|---|---|---|
| GET | `/auth/github` | Start GitHub OAuth flow |
| GET | `/auth/github/callback` | OAuth callback — issues JWT, redirects to frontend |
| POST | `/auth/logout` | Clear session |
| GET | `/user/me` | Current authenticated user |
| GET | `/user/:userId` | Internal — user lookup (service auth) |
| GET | `/repos/:repoOwner/:repoName/user-id` | Internal — resolve repo → owning user (service auth) |

**Webhooks service (`:3001/api`)**
| Method | Path | Description |
|---|---|---|
| POST | `/webhooks/github` | GitHub webhook receiver (verified via `GITHUB_WEBHOOK_SECRET`), routes `issues`/`pull_request` events to the matching agent's SQS queue based on `[TypingAgent...]` markers in the title. |

## Further reading

- [plan.md](plan.md) — original phase-by-phase build plan for the auth service and frontend.
- [workflow.md](workflow.md) — step-by-step credential setup and end-to-end usage walkthrough.