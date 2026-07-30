Step-by-step credential setup
1. GitHub OAuth App
Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
Set Homepage URL: http://localhost:5173
Set Authorization callback URL: http://localhost:3000/api/auth/github/callback
Copy Client ID → GITHUB_CLIENT_ID
Generate a Client secret → GITHUB_CLIENT_SECRET
2. GitHub Webhook Secret
Generate a random string (e.g. openssl rand -hex 32) → GITHUB_WEBHOOK_SECRET

3. Public Webhook URL (ngrok for local dev)
Copy the HTTPS URL (e.g. https://abc123.ngrok-free.app) → GITHUB_WEBHOOK_URL=https://abc123.ngrok-free.app/api/webhooks/github

The auth service registers this webhook on all your repos automatically when you log in.

4. OpenAI API Key
Go to platform.openai.com → API keys → Create new secret key
Copy it → OPENAI_API_KEY
5. JWT & Service Auth Secrets
Generate two random secrets:

Both services that talk to each other must share the same SERVICE_AUTH_SECRET.

6. Optional: Agent GitHub Tokens
If you want commits attributed to bot accounts instead of your personal account, create GitHub PATs (fine-grained, with Contents: write and Pull requests: write on the target repos) and set:

GITHUB_AGENT_BACKEND_DEV_TOKEN
GITHUB_AGENT_FRONTEND_DEV_TOKEN
GITHUB_AGENT_DEVOPS_TOKEN
GITHUB_AGENT_CODE_REVIEWER_TOKEN
7. Create .env from the example
8. Start everything
9. Test the flow
Open http://localhost:5173 and sign in with GitHub
This registers the TypingAgent webhook on all your admin repos
On any registered repo, create an issue titled [TypingAgent] <your feature description>
The TechLead agent decomposes it into sub-issues for BackendDev, FrontendDev, and/or DevOps
Each sub-agent reads its issue, writes code, and opens a PR tagged [TypingAgent-CodeReviewer]
The CodeReviewer agent reviews and merges the PR (or requests changes)