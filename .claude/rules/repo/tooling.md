---
paths:
  - "package.json"
  - "tsconfig.json"
  - ".oxlintrc.json"
  - ".oxfmtrc.json"
  - ".githooks/**"
  - "scripts/**"
  - ".nvmrc"
  - ".npmrc"
---

# Tooling

- **Node >= 24** (`.nvmrc`, `engines.node`; `.npmrc` sets `engine-strict`).
  `@types/node` follows the Node major.
- **Gates**: `npm run typecheck` (`next typegen && tsc --noEmit`), `npm run lint` (oxlint),
  `npm run format:check` (oxfmt), `npm test` (Vitest), `npm run build`. The
  main session runs them through `gate-runner`, never inline.
- **Install scripts**: npm 11 runs a package's install script only when
  `allowScripts` in `package.json` approves it. `bcrypt` loads its bundled
  prebuild and `mongodb-memory-server` downloads `mongod` on first use, so
  both are denied. Review a new one with `npm install-scripts ls`.
- **Vitest** (`vitest.config.mts`): node environment, `src/**/*.test.ts`.
  It cannot render async Server Components; pages go to `ui-checker`.
- **Pre-commit** (`.githooks/pre-commit`): oxlint `--fix` and oxfmt over the
  staged files, re-stages what they rewrote, blocks on a surviving oxlint
  error. Refuses a partially staged file. `prepare` sets `core.hooksPath` on
  every `npm install`.
- **Commit-msg** (`.githooks/commit-msg`): subject must match
  `^(feat|fix|refactor|chore|docs|test|ci)(\(scope\))?!?: `. Add a type here
  and in `CLAUDE.md` together.
- **`scripts/`**: plain Node (`*.mjs`) and one Bash script, no dependencies.
  `sdd-step.sh` globs the superpowers plugin cache for its newest scripts.
  `plan-check.mjs` tells a test block by a `test`/`it`/`describe`/`expect`
  call (Vitest names match) and caps a task at 180 lines. `worktree.mjs`
  creates `.claude/worktrees/<name>` from fresh `origin/dev`, copies
  `.env.local` and installs; `--remove` deletes it once `origin/dev` holds the
  branch.
