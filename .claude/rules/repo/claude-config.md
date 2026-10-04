---
paths:
  - ".claude/settings.json"
  - ".claude/hooks/**"
  - ".claude/skills/db-reset/**"
  - ".mcp.json"
  - ".gitignore"
  - "skills-lock.json"
  - "scripts/link-skills.mjs"
---

# Claude Code configuration

Ported from `books_demo_spa`; the same rules hold unless noted.

- **Two settings files.** `.claude/settings.json` is checked in: only rules
  every contributor wants, with no absolute paths. Personal allows (git
  writes, `gh`, plugin cache paths) go in `settings.local.json`, which stays
  git-ignored. Deny and ask rules win over any allow, so the `npm *seed*` ask
  holds beside `Bash(npm run *)`.
- **Ask rules list both shells.** On Windows Claude runs commands through
  `PowerShell` as well as `Bash`; a `Bash(...)` rule alone misses the other.
- **`format-edited.mjs`** (PostToolUse on Edit/Write) runs oxfmt from the
  nearest directory holding `.oxfmtrc.json`, because oxfmt reads `.gitignore`
  only from its working directory: from the main checkout,
  `/.claude/worktrees/` would hide every worktree file. oxfmt's `exports`
  hides `bin/`, so the hook builds the path. oxlint is left to the pre-commit
  hook.
- **`guard-shell.mjs`** (PreToolUse on Bash and PowerShell) refuses `sed -i`,
  shell redirects, `tee`, `cp` and `mv` (not `git mv`) into anything but a
  temp or scratchpad path, scripts calling `writeFileSync`/`open(…, 'w')`,
  `find` over a drive root, and, outside a subagent, a package-wide
  `npm run typecheck|lint|format:check` or `npm test`; a focused
  `npm test -- <path>` passes. Quoted text and heredoc bodies are data, except
  a quoted redirect target and a body a shell or interpreter runs.
- **`after-pr.mjs`** reminds the main session after `gh pr create` to `/clear`
  before the next spec and to close the PR's issues by hand (a PR into `dev`
  ignores closing keywords).
- **SessionStart runs `branch-check.mjs --warn`**: one line when the branch is
  behind `origin/dev`, nothing otherwise; a failed fetch exits 0.
- **`.env.local` is behind `Edit(**/.env.local)`**. `npm run worktree` copies
  it into a new worktree instead.
- **Skills.** `skills-lock.json` pins the project skills. `npm run skills`
  restores them into `.agents/skills/` and `scripts/link-skills.mjs` links
  each into `.claude/skills/`; both are per clone. Add one with
  `npx skills add <source> --skill <name> -y`. A skill a plugin already ships
  stays out of the lock. `.claude/skills/db-reset/` is the one checked-in
  skill, and it is the user's command (`disable-model-invocation`).
- **`.claude/agents/`** is git-ignored: subagent definitions are per clone.
  Without them the pipeline falls back to the skills' own templates. Each
  body carries a `<!-- Revised: YYYY-MM-DD … -->` line; bump it with every
  change.
- **`.mcp.json`** starts Playwright through `node -e` spawning `npx` with
  `shell: true`: Claude Code spawns without a shell, and a bare `npx` fails on
  Windows (it is `npx.cmd`).
- **Plugins are project dependencies.** `enabledPlugins` makes Claude Code
  offer superpowers, mattpocock-skills, code-review, ponytail and caveman on
  a fresh clone. The agents preload `caveman`, `tdd`, `ponytail` and
  `domain-modeling`; a missing skill preloads nothing, silently.
