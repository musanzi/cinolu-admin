# Cinolu Admin (Angular)

Admin application for the Cinolu platform, built with Angular (standalone APIs), Signals, Tailwind CSS, and SSR support.

## Requirements

- Node.js LTS
- `pnpm` (project uses `pnpm-lock.yaml`)

## Setup

```bash
pnpm install
```

## Scripts

- `pnpm start` - run dev server (`ng serve`)
- `pnpm build` - production build
- `pnpm watch` - development watch build
- `pnpm test` - run tests
- `pnpm lint` - run ESLint
- `pnpm format` - run Prettier on `src/**/*.{html,ts}`
- `pnpm ssr` - run compiled server bundle (`dist/admin/server/server.mjs`)

## Development Workflow

1. Start local dev:

```bash
pnpm start
```

2. Before pushing changes:

```bash
pnpm lint
pnpm exec tsc -p tsconfig.app.json --noEmit
```

3. Optional formatting:

```bash
pnpm format
```

## Architecture Notes

- Standalone components and route-based lazy loading.
- Signal-first local state (`signal`, `computed`, `effect`).
- Feature-first folder organization under `src/app/features`.
- Shared reusable UI under `src/app/shared/ui`.

## Code Standards Used in This Repo

- `ChangeDetectionStrategy.OnPush` on all components.
- Native Angular control flow in templates (`@if`, `@for`, `@switch`).
- Stable `@for` tracking keys (`track item.id` / deterministic keys), avoid `track $index` for dynamic data.
- Avoid `@HostBinding` / `@HostListener`; use `host` metadata in decorators.
- Avoid `any`; prefer strict typing and `unknown` when necessary.
- Prefer path aliases (`@core`, `@shared`, `@features`) over absolute `src/app/...` imports.
- Prefer modern type naming in new/updated code (no `I` prefix for interfaces/types).
- Keep list/search query behavior centralized via shared helpers when implementing paginated list pages.

## Project Structure

- `src/app/core` - app-level concerns (auth, guards, interceptors, providers)
- `src/app/features` - domain features (users, events, programs, projects, etc.)
- `src/app/layout` - admin and empty layouts
- `src/app/shared` - shared UI, models, pipes, helpers, services
- `src/environments` - environment configs
- `src/server.ts` - Express SSR entry
- `public/` - static assets

## SSR

Build first, then run:

```bash
pnpm build
pnpm ssr
```

## License

See repository license policy.
