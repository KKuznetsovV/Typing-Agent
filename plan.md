# GitHub OAuth App — Build Plan

This document is a step-by-step implementation guide for a full-stack GitHub OAuth application. Follow each phase in order; later phases depend on earlier ones.

---

## Architecture Overview

```
┌─────────────┐     OAuth redirect      ┌─────────────┐
│   React     │ ◄──────────────────────►│   GitHub    │
│  (Vite)     │                         └─────────────┘
│  :5173      │
└──────┬──────┘
       │ JWT in Authorization header / httpOnly cookie
       ▼
┌─────────────┐     Mongoose            ┌─────────────┐
│   Express   │ ◄──────────────────────►│   MongoDB   │
│  (TS)       │                         │   :27017    │
│  :3000      │
└─────────────┘
```

**Auth flow:**
1. User clicks "Sign in with GitHub" on the Login screen.
2. Frontend redirects to `GET /api/auth/github` (backend).
3. Passport redirects to GitHub OAuth consent.
4. GitHub redirects to `GET /api/auth/github/callback`.
5. Backend upserts user in MongoDB, signs a JWT, redirects to frontend with token (or sets httpOnly cookie).
6. Frontend stores token, calls protected routes with `Authorization: Bearer <token>`.
7. Welcome screen shows user info; Logout clears token and calls backend logout if needed.

---

## Repository Layout

```
04-typing-agent/
├── plan.md
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── config/
│   │   ├── default.json
│   │   ├── development.json
│   │   ├── production.json
│   │   └── custom-environment-variables.json
│   └── src/
│       ├── app.ts
│       ├── server.ts
│       ├── config/
│       │   └── index.ts              # typed config accessor
│       ├── db/
│       │   └── connection.ts
│       ├── models/
│       │   └── User.ts
│       ├── middleware/
│       │   ├── authenticate.ts       # JWT verification
│       │   ├── validate.ts           # Joi wrapper
│       │   └── errorHandler.ts
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   └── user.controller.ts
│       ├── routes/
│       │   ├── index.ts              # mounts all routers
│       │   ├── auth.routes.ts
│       │   └── user.routes.ts
│       ├── services/
│       │   ├── auth.service.ts
│       │   └── user.service.ts
│       ├── passport/
│       │   └── github.strategy.ts
│       └── types/
│           └── express.d.ts          # augment Request with user
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── .env.development
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   └── client.ts
        ├── context/
        │   └── AuthContext.tsx
        └── components/
            ├── Login.tsx
            └── Welcome.tsx
```

---

## Phase 1 — Backend Scaffolding

### 1.1 Initialize project

```bash
mkdir backend && cd backend
npm init -y
```

### 1.2 Install dependencies

**Runtime:**
```bash
npm install express mongoose config passport passport-github2 jsonwebtoken joi cors cookie-parser
npm install -D typescript @types/node @types/express @types/passport @types/passport-github2 @types/jsonwebtoken @types/cors @types/cookie-parser ts-node-dev
```

### 1.3 TypeScript config (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.4 `package.json` scripts

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

## Phase 2 — node-config Setup

Use `config` (node-config), **not** dotenv. Environment variables override JSON via `custom-environment-variables.json`.

### 2.1 `config/default.json`

```json
{
  "port": 3000,
  "mongoUri": "mongodb://localhost:27017/oauth-app",
  "jwt": {
    "secret": "change-me-in-production",
    "expiresIn": "7d"
  },
  "github": {
    "clientId": "",
    "clientSecret": "",
    "callbackUrl": "http://localhost:3000/api/auth/github/callback"
  },
  "frontend": {
    "url": "http://localhost:5173"
  },
  "cors": {
    "origin": "http://localhost:5173"
  }
}
```

### 2.2 `config/development.json`

```json
{
  "mongoUri": "mongodb://mongodb:27017/oauth-app"
}
```

(Used inside Docker Compose where the MongoDB service hostname is `mongodb`.)

### 2.3 `config/production.json`

```json
{
  "jwt": {
    "secret": ""
  }
}
```

### 2.4 `config/custom-environment-variables.json`

```json
{
  "port": "PORT",
  "mongoUri": "MONGO_URI",
  "jwt": {
    "secret": "JWT_SECRET",
    "expiresIn": "JWT_EXPIRES_IN"
  },
  "github": {
    "clientId": "GITHUB_CLIENT_ID",
    "clientSecret": "GITHUB_CLIENT_SECRET",
    "callbackUrl": "GITHUB_CALLBACK_URL"
  },
  "frontend": {
    "url": "FRONTEND_URL"
  },
  "cors": {
    "origin": "CORS_ORIGIN"
  }
}
```

### 2.5 Typed config accessor (`src/config/index.ts`)

```typescript
import config from 'config';

export const appConfig = {
  port: config.get<number>('port'),
  mongoUri: config.get<string>('mongoUri'),
  jwt: {
    secret: config.get<string>('jwt.secret'),
    expiresIn: config.get<string>('jwt.expiresIn'),
  },
  github: {
    clientId: config.get<string>('github.clientId'),
    clientSecret: config.get<string>('github.clientSecret'),
    callbackUrl: config.get<string>('github.callbackUrl'),
  },
  frontend: {
    url: config.get<string>('frontend.url'),
  },
  cors: {
    origin: config.get<string>('cors.origin'),
  },
};
```

---

## Phase 3 — Database & Models

### 3.1 MongoDB connection (`src/db/connection.ts`)

- Export `connectDB()` that calls `mongoose.connect(appConfig.mongoUri)`.
- Log success/failure; exit process on failure in production.

### 3.2 User model (`src/models/User.ts`)

```typescript
interface IUser {
  githubId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

- `githubId`: unique, required, indexed.
- Use `timestamps: true`.
- Export `User` model and `IUser` interface.

---

## Phase 4 — Express App Structure

**Rule:** Routers only map HTTP methods + paths to middleware chains. No business logic in route files.

### 4.1 `src/app.ts`

Responsibilities:
- `express.json()`, `cookie-parser()`, `cors({ origin, credentials: true })`
- Initialize Passport: `passport.initialize()`
- Mount routers at `/api`
- Global error handler (last middleware)

### 4.2 `src/server.ts`

- `connectDB()` then `app.listen(appConfig.port)`
- Import and register GitHub Passport strategy before listening.

### 4.3 Route mounting (`src/routes/index.ts`)

```typescript
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
```

### 4.4 Auth routes (`src/routes/auth.routes.ts`)

| Method | Path              | Middleware chain                          | Controller              |
|--------|-------------------|-------------------------------------------|-------------------------|
| GET    | `/github`         | passport.authenticate('github')           | — (Passport handles)    |
| GET    | `/github/callback`| passport.authenticate + authController.callback | authController.callback |
| POST   | `/logout`         | authenticate                              | authController.logout   |

### 4.5 User routes (`src/routes/user.routes.ts`)

| Method | Path    | Middleware chain | Controller            |
|--------|---------|------------------|-----------------------|
| GET    | `/me`   | authenticate     | userController.getMe  |

---

## Phase 5 — Middleware

### 5.1 Joi validation wrapper (`src/middleware/validate.ts`)

```typescript
export const validate = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) return res.status(400).json({ errors: error.details.map(d => d.message) });
    req[property] = value;
    next();
  };
```

Use on routes that accept input (e.g. future profile update). OAuth routes need no body validation.

### 5.2 JWT authenticate (`src/middleware/authenticate.ts`)

- Read token from `Authorization: Bearer <token>` header **or** `req.cookies.token`.
- `jwt.verify(token, appConfig.jwt.secret)`.
- Attach decoded payload to `req.user` (augment Express `Request` in `src/types/express.d.ts`).
- Return `401` if missing/invalid.

### 5.3 Error handler (`src/middleware/errorHandler.ts`)

- Catch unhandled errors; return `{ message }` with appropriate status.

---

## Phase 6 — Passport GitHub Strategy

### 6.1 Register OAuth app on GitHub

1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.
2. Homepage URL: `http://localhost:5173`
3. Authorization callback URL: `http://localhost:3000/api/auth/github/callback`
4. Copy Client ID and Client Secret into env vars (or `default.json` for local dev only).

### 6.2 Strategy (`src/passport/github.strategy.ts`)

```typescript
passport.use(new GitHubStrategy({
  clientID: appConfig.github.clientId,
  clientSecret: appConfig.github.clientSecret,
  callbackURL: appConfig.github.callbackUrl,
  scope: ['user:email'],
}, async (accessToken, refreshToken, profile, done) => {
  // upsert user via userService.findOrCreateFromGitHub(profile)
}));
```

### 6.3 Serialize / deserialize

For JWT-based API auth, use minimal session serialization or skip sessions entirely:
- In the callback controller, sign JWT directly after Passport authenticates.
- `passport.authenticate('github', { session: false })` on both routes.

---

## Phase 7 — Controllers & Services

### 7.1 Auth service (`src/services/auth.service.ts`)

- `signToken(userId: string): string` — `jwt.sign({ sub: userId }, secret, { expiresIn })`
- `verifyToken(token: string)` — wrapper around `jwt.verify`

### 7.2 User service (`src/services/user.service.ts`)

- `findOrCreateFromGitHub(profile)` — upsert by `githubId`, return user document.
- `findById(id)` — for `/me` endpoint.

### 7.3 Auth controller (`src/controllers/auth.controller.ts`)

**`callback`:**
1. User is available on `req.user` after Passport middleware.
2. Sign JWT with user `_id`.
3. Redirect to `${appConfig.frontend.url}/welcome?token=${token}` **or** set httpOnly cookie and redirect to `/welcome`.

   Prefer httpOnly cookie for security; if using query param for simplicity, frontend must strip it from URL immediately.

**`logout`:**
- Clear cookie if used; return `{ success: true }`.

### 7.4 User controller (`src/controllers/user.controller.ts`)

**`getMe`:**
- Read `req.user.sub` (JWT payload).
- Fetch user from DB; return `{ id, username, displayName, avatarUrl }`.
- `404` if user not found.

---

## Phase 8 — Frontend (Vite + React + TypeScript)

> **Status:** `frontend/` folder scaffolded with `npm create vite@latest frontend -- --template react-ts`.

### 8.1 Environment (`frontend/.env.development`)

```
VITE_API_URL=http://localhost:3000/api
```

Access via `import.meta.env.VITE_API_URL`.

### 8.2 API client (`src/api/client.ts`)

```typescript
const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

### 8.3 Auth context (`src/context/AuthContext.tsx`)

State: `user | null`, `loading`, `token`.

Methods:
- `login()` — `window.location.href = `${API_URL}/auth/github``
- `logout()` — clear token, call `POST /auth/logout`, set user null
- `checkAuth()` — on mount, if token exists call `GET /user/me`; on 401 clear token

On app load, parse `?token=` from URL (if using redirect flow), save to localStorage, remove from address bar with `history.replaceState`.

### 8.4 Components

**`Login.tsx`**
- Centered card with app title.
- Button: "Sign in with GitHub" → calls `login()` from context.
- Shown when `!user && !loading`.

**`Welcome.tsx`**
- "Welcome, {displayName || username}!"
- Optional avatar image from GitHub.
- Logout button → calls `logout()`.
- Shown when `user` is set.

### 8.5 `App.tsx`

```tsx
function App() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return user ? <Welcome /> : <Login />;
}
```

Wrap app in `<AuthProvider>` in `main.tsx`.

### 8.6 Vite proxy (optional, dev only)

In `vite.config.ts`, proxy `/api` to `http://localhost:3000` so cookies work same-origin:

```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3000',
  },
},
```

If using proxy, set `VITE_API_URL=/api` in `.env.development`.

---

## Phase 9 — Docker

### 9.1 `backend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

For dev, use a multi-stage or override with `ts-node-dev` via compose command.

### 9.2 `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Add `nginx.conf` to SPA-fallback `try_files $uri /index.html`.

### 9.3 `docker-compose.yml` (project root)

```yaml
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      MONGO_URI: mongodb://mongodb:27017/oauth-app
      JWT_SECRET: ${JWT_SECRET:-dev-secret-change-me}
      GITHUB_CLIENT_ID: ${GITHUB_CLIENT_ID}
      GITHUB_CLIENT_SECRET: ${GITHUB_CLIENT_SECRET}
      GITHUB_CALLBACK_URL: http://localhost:3000/api/auth/github/callback
      FRONTEND_URL: http://localhost:5173
      CORS_ORIGIN: http://localhost:5173
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./frontend
      args:
        VITE_API_URL: http://localhost:3000/api
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  mongo_data:
```

### 9.4 Root `.env` (for compose, gitignored)

```
JWT_SECRET=your-random-secret
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

---

## Phase 10 — GitHub OAuth App Registration Checklist

- [ ] Create OAuth App on GitHub
- [ ] Set callback URL to match `GITHUB_CALLBACK_URL`
- [ ] Add env vars locally and in Docker Compose
- [ ] For production, update callback URL and `FRONTEND_URL` / `CORS_ORIGIN`

---

## Phase 11 — Implementation Order (Checklist)

Execute in this exact order when building:

1. [ ] **Backend scaffold** — package.json, tsconfig, folder structure
2. [ ] **node-config** — all JSON config files + typed accessor
3. [ ] **DB connection + User model**
4. [ ] **Express app + server** — bare health route first (`GET /api/health`)
5. [ ] **Error handler middleware**
6. [ ] **Passport GitHub strategy + auth routes**
7. [ ] **JWT middleware + auth/user services + controllers**
8. [ ] **User routes** (`GET /me`)
9. [ ] **Frontend env + API client + AuthContext**
10. [ ] **Login + Welcome components + App wiring**
11. [ ] **End-to-end local test** (MongoDB local, backend dev, frontend dev)
12. [ ] **Backend Dockerfile**
13. [ ] **Frontend Dockerfile + nginx.conf**
14. [ ] **docker-compose.yml**
15. [ ] **Full Docker test**

---

## Phase 12 — Testing the Flow

### Local (no Docker)

```bash
# Terminal 1 — MongoDB (or use Docker only for mongo)
docker run -p 27017:27017 mongo:7

# Terminal 2 — Backend
cd backend && npm run dev

# Terminal 3 — Frontend
cd frontend && npm run dev
```

1. Open `http://localhost:5173`
2. Click "Sign in with GitHub"
3. Authorize on GitHub
4. Should land on Welcome screen with your GitHub username
5. Refresh page — should stay logged in (token in localStorage)
6. Click Logout — should return to Login screen

### With Docker Compose

```bash
docker compose up --build
```

Visit `http://localhost:5173` (nginx on port 80 mapped to 5173).

---

## Security Notes

- Never commit `GITHUB_CLIENT_SECRET` or `JWT_SECRET`.
- Use strong `JWT_SECRET` in production.
- Prefer httpOnly + Secure cookies over localStorage for tokens in production.
- Validate `CORS_ORIGIN` — do not use `*` with credentials.
- Rate-limit auth endpoints in production (future enhancement).

---

## API Reference (Final)

| Method | Endpoint                    | Auth     | Description                    |
|--------|-----------------------------|----------|--------------------------------|
| GET    | `/api/health`               | No       | Health check                   |
| GET    | `/api/auth/github`          | No       | Start GitHub OAuth             |
| GET    | `/api/auth/github/callback` | No       | GitHub OAuth callback          |
| POST   | `/api/auth/logout`          | Yes      | Logout                         |
| GET    | `/api/user/me`              | Yes      | Current user profile           |

---

## Dependencies Summary

### Backend
| Package              | Purpose                |
|----------------------|------------------------|
| express              | HTTP server            |
| mongoose             | MongoDB ODM            |
| config               | Configuration (node-config) |
| passport             | Auth framework         |
| passport-github2     | GitHub OAuth strategy  |
| jsonwebtoken         | JWT sign/verify        |
| joi                  | Input validation       |
| cors                 | CORS middleware        |
| cookie-parser        | Cookie parsing         |

### Frontend
| Package   | Purpose        |
|-----------|----------------|
| react     | UI             |
| react-dom | DOM rendering  |
| vite      | Build tool     |

No extra frontend auth libraries needed — native `fetch` + React context is sufficient for this scope.
