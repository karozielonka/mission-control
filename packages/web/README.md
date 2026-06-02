# @dashboard/web

React 19 + Vite frontend for Mission Control. See the [root README](../../README.md) for setup and prerequisites.

## Stack

- React 19 + Vite 8
- Tailwind v4 (via `@tailwindcss/vite`)
- shadcn/ui on Radix primitives
- Zustand for state
- `@dashboard/shared` for API types

## Local development

From the repo root:

```bash
pnpm dev:web
```

Or from this package:

```bash
pnpm dev
```

Dev server runs on http://localhost:5173 and expects the API at http://localhost:4000 (see `src/config.ts`).

## Scripts

- `pnpm dev` — Vite dev server with HMR
- `pnpm build` — typecheck (`tsc -b`) + production build to `dist/`
- `pnpm preview` — serve the built `dist/` locally
- `pnpm lint` — ESLint
