# Claude Code — restoran_demo_ssr

Restaurant demo site rendered on the server: public menu, delivery orders,
table bookings, reviews and complaints, user account and admin. UI text is
English, money is USD stored as integer cents.

## Stack

- Next.js 16.3 (App Router), React 19, TypeScript. **Read the guide under
  `node_modules/next/dist/docs/` before using any Next.js API** (see
  `AGENTS.md`).
- Tailwind 4, shadcn/ui on `@base-ui/react` (not Radix).
- MongoDB + Mongoose; zod; Server Actions for mutations, Route Handlers for
  SSE and image delivery; dnd-kit; sharp; Vitest + mongodb-memory-server.
- Own auth: cookie sessions, bcrypt, session tokens stored as SHA-256.
- Runs locally on one Node process (in-memory SSE emitter, `uploads/` on disk).

## Quality Gates

`npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`,
`npm run build`. Dispatch `gate-runner` instead of running them inline.

## Anti-Patterns

- Absolute local paths in checked-in files.
- Documenting a command, script or dependency that `package.json` lacks.
- Growing this file past ~200 lines: a new trap goes into a `.claude/rules/`
  file with `paths:` naming the files it concerns.
- A comment that says _what_ the code does. Comments carry why, what breaks
  otherwise, or an upstream bug.
- `any` (use `unknown`), `@ts-ignore` (use `@ts-expect-error` with a reason),
  `enum` (use `as const`), class components, `dangerouslySetInnerHTML`.
- Floats for money; a role check only in the UI (every Server Action and
  Route Handler checks the session and role itself).

## Workflow

1. Name domain things the way `CONTEXT.md` does; check `docs/adr/` before
   contradicting a recorded decision.
2. Conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`,
   `test:`, `ci:`).
3. Branch from `dev` and open the PR against `dev`; `main` only receives
   `dev`. Run `npm run branch:check` before starting work and before a PR.

## Agent skills

- **Project skills**: `npm run skills` restores them after a fresh clone or a
  lock change (`.claude/rules/repo/claude-config.md`).
- **Plugins**: `.claude/settings.json` enables superpowers, mattpocock-skills,
  code-review, ponytail and caveman.
- **Context-saving agents** (`.claude/agents/`, git-ignored, per clone):
  `repo-auditor` for any "check / audit / find all" request; `gate-runner`
  (haiku) for the gates and CI; `ui-checker` for pages and flows in the
  browser through the Playwright MCP. Search goes to `Explore` or
  `caveman:cavecrew-investigator`, never `general-purpose`.
- **Plan pipeline**: read `.claude/rules/repo/pipeline.md` before running it.
  Save the spec under `docs/superpowers/specs/` before `code-mapper` and
  `plan-writer`. One spec per main session. Pass `model` on every dispatch,
  opus only when the user asks.

### Shell on Windows

Git Bash: `cd "D:/path" && …` with forward slashes. Create and change files
only with `Write`/`Edit`; `sed -i`, `cp`, `>` skip the oxfmt hook. When `Grep`
fails with `EPERM ... uv_spawn 'rg'`, fall back to `git grep`.
