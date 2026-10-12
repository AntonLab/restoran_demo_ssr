---
paths:
  - ".claude/settings.json"
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
- **Tool hooks come from the `swarm` plugin**, whose README lists what each
  one does: `guard-shell` refuses shell writes into repo files, `sed -i`,
  pushes to `dev` or `main`, and package-wide gates in the main session (a
  focused `npm test -- <path>` passes); `format-edited` runs oxfmt from the
  nearest folder holding `.oxfmtrc.json`, since oxfmt reads `.gitignore` only
  from its working directory; `after-pr` reminds the main session to `/clear`
  after `gh pr create`. Change them in `AntonLab/custom-agents-swarm`, not
  here. oxlint is left to the pre-commit hook.
- **SessionStart runs `branch-check.mjs --warn`**: one line when the branch is
  behind `origin/dev`, nothing otherwise; a failed fetch exits 0. It also
  runs `preflight.mjs`: one line per gap (Node major other than `.nvmrc`, no
  `.env.local`, MongoDB not answering), nothing when ready, always exit 0.
- **`.env.local` is behind `Edit(**/.env.local)`**. `npm run worktree` copies
  it into a new worktree instead.
- **Skills.** `skills-lock.json` pins the project skills. `npm run skills`
  restores them into `.agents/skills/` and `scripts/link-skills.mjs` links
  each into `.claude/skills/`; both are per clone. Add one with
  `npx skills add <source> --skill <name> -y`. A skill a plugin already ships
  stays out of the lock. `.claude/skills/db-reset/` is the one checked-in
  skill, and it is the user's command (`disable-model-invocation`).
- **`.claude/agents/`** stays ignored and empty: the pipeline agents come
  from the `swarm` plugin as `swarm:<name>`. Copies left there from before
  the plugin are stale; delete them.
- **`.mcp.json`** starts Playwright through `node -e` spawning `npx` with
  `shell: true`: Claude Code spawns without a shell, and a bare `npx` fails on
  Windows (it is `npx.cmd`).
- **Plugins are project dependencies.** `enabledPlugins` makes Claude Code
  offer superpowers, mattpocock-skills, code-review, ponytail, caveman and swarm
  on a fresh clone. The agents preload `caveman`, `tdd`, `ponytail` and
  `domain-modeling`; a missing skill preloads nothing, silently.
- **`swarm` comes from `AntonLab/custom-agents-swarm`**, a private
  marketplace, so installing it needs git credentials for that repo. It ships
  the pipeline agents (`swarm:code-mapper` and the rest), `/swarm:ship`,
  `/swarm:queue` and the tool hooks. Run `/plugin marketplace update` after
  a change there lands.
