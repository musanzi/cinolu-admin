# Repository Guidelines

## Project Structure & Module Organization

This repository is an Angular 21 admin app with SSR. Application code lives in `src/`. Use `src/app/core/` for auth, guards, interceptors, and app-wide providers; `src/app/features/` for route-level domains such as `projects`, `users`, and `programs`; `src/app/shared/` for reusable UI, models, pipes, and helpers; and `src/app/layout/` for the admin shell. Static assets live in `public/`, global styles in `src/styles/`, and environment files in `src/environments/`.

## Build, Test, and Development Commands

Use `pnpm` for all commands.

- `pnpm start`: starts the Angular dev server.
- `pnpm build`: creates the browser and server bundles in `dist/`.
- `pnpm watch`: rebuilds continuously with the development config.
- `pnpm ssr`: runs the built SSR server from `dist/admin/server/server.mjs`.
- `pnpm lint`: runs ESLint across the Angular app.
- `pnpm format`: formats `src/**/*.{ts,html}` with Prettier.

## Coding Style & Naming Conventions

Follow `.editorconfig`: UTF-8, spaces, and 2-space indentation. Prettier enforces 120-character lines, single quotes, and no trailing commas. Prefer path aliases such as `@core/*`, `@shared/*`, and `@features/*` over long relative imports. Keep Angular selectors aligned with the existing conventions: components use `app-...` kebab-case and directives use `app...` camelCase. Match the existing feature layout: `pages/`, `components/`, `services/`, `store/`, `types/` and `dto/`. and section logic to components, and keep store interaction close to the container that owns the workflow.
