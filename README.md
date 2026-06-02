# Claude Dashboard

A monorepo dashboard that aggregates context from GitHub, Linear, and Sentry and exposes it to Claude agents running against a local platform repo.

## Packages

- `packages/web` — React 19 + Vite frontend (Tailwind v4, shadcn/Radix, Zustand)
- `packages/server` — Fastify backend that proxies GitHub / Linear / Sentry
- `packages/shared` — shared TypeScript types and API clients

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- pnpm 9+ (`npm install -g pnpm`)
- A local checkout of the platform repo you want the agents to operate on

## Setup

```bash
git clone <repo-url> claude-dashboard
cd claude-dashboard
cp .env.example .env
# fill in the values in .env (see below)
pnpm install
pnpm dev
```

The web app runs on http://localhost:5173 and the server on http://localhost:4000.

## Environment variables

All vars live in a single `.env` at the repo root. See `.env.example` for the full list.

| Variable | How to get it |
| --- | --- |
| `PLATFORM_DIR` | Absolute path to your local platform repo checkout. The server uses this as the working directory for Claude agents. |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | Create at https://github.com/settings/tokens with `repo` and `read:user` scopes. |
| `LINEAR_API_KEY` | Personal API key from https://linear.app/settings/api |
| `SENTRY_ACCESS_TOKEN` | Auth token from https://sentry.io/settings/account/api/auth-tokens/ |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Your Sentry org and project slugs |
| `PORT` | Server port (defaults to 4000) |

## Scripts

- `pnpm dev` — run web + server together (turbo)
- `pnpm dev:web` — web only
- `pnpm dev:server` — server only
- `pnpm build` — build all packages

## Troubleshooting

- **`PLATFORM_DIR: (not set)`** in server logs — fill in `PLATFORM_DIR` in `.env` and restart.
- **CORS errors in browser** — the server only allows `localhost`/`127.0.0.1` origins; make sure the web app is on one of those.
- **Stale lockfile** — delete `node_modules` and `pnpm-lock.yaml`, then re-run `pnpm install`.
