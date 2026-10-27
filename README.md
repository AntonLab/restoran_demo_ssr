# Restoran Demo SSR

A restaurant demo site rendered on the server: public menu, delivery orders,
table bookings, reviews and complaints, user account and admin area. UI text is
English, money is USD stored as integer cents.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind 4, shadcn/ui on `@base-ui/react`
- MongoDB + Mongoose, zod
- Server Actions for mutations, Route Handlers for image delivery, sharp
- Own auth: cookie sessions, bcrypt, session tokens stored as SHA-256
- Vitest + mongodb-memory-server, oxlint, oxfmt

## Requirements

- Node >= 24 (see `.nvmrc`)
- A running MongoDB instance

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit the values
npm run seed                 # menu, settings and the admin account
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

Set in `.env.local` (git-ignored). See `.env.example`.

| Variable         | Purpose                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `MONGODB_URI`    | MongoDB connection string                                            |
| `ADMIN_EMAIL`    | Admin account email, created only by `npm run seed`                  |
| `ADMIN_PASSWORD` | Admin account password                                               |
| `APP_BASE_URL`   | Base for links in emails (password reset)                            |
| `TRUST_PROXY`    | Number of reverse proxies in front of the app; unset ignores proxies |
| `UPLOADS_DIR`    | Optional. Where uploaded images live; defaults to `uploads/`         |

## Scripts

| Command                | What it does                                 |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the dev server                         |
| `npm run build`        | Production build                             |
| `npm start`            | Run the production build                     |
| `npm run seed`         | Seed the database                            |
| `npm test`             | Run tests once (`test:watch` to watch)       |
| `npm run typecheck`    | `next typegen` and `tsc --noEmit`            |
| `npm run lint`         | oxlint (`lint:fix` to autofix)               |
| `npm run format`       | oxfmt (`format:check` to verify)             |
| `npm run branch:check` | Check the branch setup before work or a PR   |
| `npm run worktree`     | Create or remove a git worktree for a branch |
| `npm run skills`       | Restore project agent skills after a clone   |

## Project layout

- `src/app/` — routes: menu, cart, checkout, booking, feedback, auth, account, admin, image route
- `src/components/` — UI components, grouped by feature
- `src/server/` — models, queries, auth, mail, rate limiting, seed data
- `src/lib/` — shared helpers and view logic
- `seed/` — seed runner and dish images
- `docs/` — specs, plans and agent notes
- `scripts/` — plain Node helper scripts

## Contributing

- Branch from `dev` and open the PR against `dev`; `main` only receives `dev`.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `ci:`.
- CI runs lint, format check, typecheck, tests and build on every PR.
- Domain terms are defined in [CONTEXT.md](CONTEXT.md); coding rules in
  [CODING_STANDARDS.md](CODING_STANDARDS.md).
