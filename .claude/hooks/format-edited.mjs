/**
 * PostToolUse hook: runs oxfmt over the file Claude just edited, so the
 * pre-commit hook finds nothing left to rewrite.
 *
 * oxfmt runs from the nearest directory holding `.oxfmtrc.json`, not from the
 * session's root: oxfmt reads `.gitignore` only from its working directory,
 * and from the main checkout `/.claude/worktrees/` would hide every file in a
 * worktree. A file outside any checkout, or one oxfmt cannot parse, is left
 * alone; the hook never fails the edit.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const file = JSON.parse(readFileSync(0, "utf8")).tool_input?.file_path;

let dir = file ? dirname(resolve(file)) : null;
while (dir && !existsSync(join(dir, ".oxfmtrc.json"))) {
  dir = dirname(dir) === dir ? null : dirname(dir);
}

// oxfmt's `exports` hides `bin/`, so the path is built, not resolved.
const bin = dir && join(dir, "node_modules", "oxfmt", "bin", "oxfmt");
if (bin && existsSync(bin)) {
  spawnSync(process.execPath, [bin, "--no-error-on-unmatched-pattern", file], {
    cwd: dir,
    stdio: "ignore",
  });
}
