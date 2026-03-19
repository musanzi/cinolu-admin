# Cinolu Admin

Administrative web application for managing the Cinolu platform.

Built with **Angular 21**, **TypeScript**, **Signals**, **Tailwind CSS**, and **SSR**, this app powers Cinolu’s internal back-office for managing programs, projects, events, blog content, users, mentors, ventures, and account settings.

## Stack

- Angular 21
- TypeScript
- Angular Signals / NgRx Signals
- Tailwind CSS v4
- Angular SSR + Express
- ESLint + Prettier
- pnpm

## Features

- Authenticated admin area
- Dashboard and account management
- Management for programs, projects, events, blog posts, users, mentors, and ventures
- Feature-first architecture with shared UI and utilities
- Server-side rendering support

## Getting Started

```bash
pnpm install
pnpm start
```

Default dev port: **4000**

## Scripts

```bash
pnpm start    # run dev server
pnpm build    # production build
pnpm watch    # watch mode
pnpm test     # run tests
pnpm lint     # lint codebase
pnpm format   # format source files
pnpm ssr      # run built SSR server
```

## Project Structure

```text
src/
├── app/core      # app-wide concerns
├── app/features  # domain features
├── app/layout    # layouts and shell
├── app/shared    # reusable UI and helpers
└── environments  # environment configs
```

## License

MIT — see [LICENSE](./LICENSE).
