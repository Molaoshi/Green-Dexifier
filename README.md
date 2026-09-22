# Dexifier Monorepo

All Dexifier products in one repository. Each app is self-contained (own
`package.json` + lockfile) so one app's dependency changes can never break
another's build. Shared code will live in `packages/` when a second consumer
exists.

## Layout

- `apps/web` — dexifier.com swap front-end (Next.js 15, React 19, Prisma)
- `apps/explorer` — explorer.dexifier.com swap explorer (Next.js 15 app router)
- `packages/` — future shared packages (ui kit, design tokens)

## Commands

```bash
npm run dev:web         # dexifier.com app
npm run dev:explorer    # explorer
npm run build:web
npm run build:explorer
```

## Deployment

Both apps deploy to Railway as separate services with the service root
directory set to the app's folder (`apps/web`, `apps/explorer`).

## Rules

- Secrets live in Railway env vars only — never in files, commits, or docs.
- `main` is protected; all work lands via PR from `dex/*`, `perp/*`, or
  `explorer/*` branches.
- No fake data anywhere: if a number can't be sourced, it isn't rendered.
