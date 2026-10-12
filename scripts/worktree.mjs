/**
 * Creates a task worktree under .claude/worktrees/ ready for agents, or
 * removes one once its branch has merged:
 *
 *   npm run worktree -- <name> <branch> [start-point]
 *   npm run worktree -- --remove <name>
 *
 * The start point defaults to a freshly fetched `origin/dev`, so a new branch
 * never starts stale. The script copies the git-ignored `.env.local` from the
 * main checkout: without it the dev server and the seed cannot reach MongoDB,
 * and an agent cannot copy it itself because `.env.local` is behind a deny
 * rule. It points `UPLOADS_DIR` at the main checkout's `uploads/` unless
 * `.env.local` sets it, and installs with the Node major `.nvmrc` names.
 *
 * Removal refuses a worktree with uncommitted changes or a branch that
 * `origin/dev` does not contain yet. It also deletes the main checkout's
 * `.playwright-mcp` and the `docs/superpowers` notes whose topic is `<name>`.
 */
import { execFileSync, execSync } from "node:child_process";
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { delimiter, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const git = (...args) => execFileSync("git", args, { cwd: root, stdio: "inherit" });
const gitOutput = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const worktreePath = (name) => join(root, ".claude", "worktrees", name);

const remove = (name) => {
  const target = worktreePath(name);
  if (!existsSync(target)) {
    console.error(`worktree: ${target} does not exist`);
    process.exit(1);
  }

  const registered = gitOutput(root, "worktree", "list", "--porcelain")
    .split("\n")
    .some((line) => resolve(line.slice("worktree ".length)) === target);
  if (registered) {
    if (gitOutput(target, "status", "--porcelain") !== "") {
      console.error(`worktree: ${name} has uncommitted changes; left in place`);
      process.exit(1);
    }
    const branch = gitOutput(target, "branch", "--show-current");
    git("fetch", "--quiet", "origin", "dev");
    try {
      execFileSync("git", ["merge-base", "--is-ancestor", branch, "origin/dev"], {
        cwd: root,
      });
    } catch {
      console.error(`worktree: origin/dev does not contain ${branch} yet; left in place`);
      process.exit(1);
    }
    git("worktree", "remove", target);
    // `-D`: `-d` would judge the merge against the main checkout's HEAD,
    // which need not be dev; the ancestor check above is the real guard.
    git("branch", "-D", branch);
  }

  // On Windows `git worktree remove` can leave node_modules behind, so the
  // directory itself survives.
  rmSync(target, { recursive: true, force: true });
  git("worktree", "prune");
  // Playwright MCP output lands in the main checkout's root whichever
  // worktree the check ran against.
  rmSync(join(root, ".playwright-mcp"), { recursive: true, force: true });
  // The task's spec, code map, follow-ups and plan are git-ignored working
  // notes that nothing reads once its branch has merged. Only files whose
  // topic equals `name` go, so a task still running keeps its own.
  for (const dir of ["specs", "plans"]) {
    const notes = join(root, "docs", "superpowers", dir);
    if (!existsSync(notes)) continue;
    for (const file of readdirSync(notes)) {
      const topic = file
        .slice("YYYY-MM-DD-".length)
        .replace(/(-design|-codemap|-followups)?\.md$/, "");
      if (topic === name) rmSync(join(notes, file));
    }
  }
  console.log(`worktree: removed ${name}`);
};

// nvm-windows keeps `v<x>/node.exe` under NVM_HOME; nvm keeps
// `versions/node/v<x>/bin/node` under NVM_DIR. Returns the highest match.
const findNodeWithMajor = (major, { NVM_HOME, NVM_DIR } = process.env) => {
  const [base, binSub] = NVM_HOME
    ? [NVM_HOME, ""]
    : NVM_DIR
      ? [join(NVM_DIR, "versions", "node"), "bin"]
      : [];
  if (!base || !existsSync(base)) return null;
  const version = readdirSync(base)
    .filter((d) => d.startsWith(`v${major}.`))
    .map((d) => d.slice(1))
    .toSorted((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .at(-1);
  return version ? { version, dir: join(base, `v${version}`, binSub) } : null;
};

const create = (name, branch, startPoint = "origin/dev") => {
  const target = worktreePath(name);
  if (existsSync(target)) {
    console.error(`worktree: ${target} already exists`);
    process.exit(1);
  }

  git("fetch", "--quiet", "origin", "dev");
  git("worktree", "add", "-q", "-b", branch, target, startPoint);

  for (const envFile of [".env.local"]) {
    if (existsSync(join(root, envFile))) {
      copyFileSync(join(root, envFile), join(target, envFile));
      console.log(`worktree: copied ${envFile}`);
    }
  }
  // `uploads/` is git-ignored but the worktree shares the main checkout's
  // MongoDB, whose Dishes point at images there; the image route defaults to
  // `<cwd>/uploads` and would 404 every seeded image.
  const envLocal = join(target, ".env.local");
  if (existsSync(envLocal) && !/^UPLOADS_DIR=/m.test(readFileSync(envLocal, "utf8"))) {
    appendFileSync(envLocal, `\nUPLOADS_DIR=${join(root, "uploads").replaceAll("\\", "/")}\n`);
    console.log("worktree: UPLOADS_DIR points at the main checkout's uploads");
  }

  // `.npmrc` sets engine-strict, so installing under a Node the dependencies
  // reject (EBADENGINE) fails. `nvm use` would change Node machine-wide, so
  // prepend the matching version's directory to this install's PATH only.
  const env = { ...process.env };
  const major = readFileSync(join(target, ".nvmrc"), "utf8").trim().replace(/^v/, "").split(".")[0];
  if (process.versions.node.split(".")[0] !== major) {
    const found = findNodeWithMajor(major);
    if (!found) {
      console.error(
        `worktree: Node ${major} (.nvmrc) is not installed; run \`nvm install ${major}\``,
      );
      process.exit(1);
    }
    env.PATH = `${found.dir}${delimiter}${process.env.PATH}`;
    console.log(`worktree: installing with Node ${found.version} from .nvmrc`);
  }

  // One string: npm is npm.cmd on Windows, which needs a shell, and an args
  // array beside `shell: true` trips Node's DEP0190 warning.
  execSync("npm install --silent --no-audit --no-fund", {
    cwd: target,
    env,
    stdio: "inherit",
  });

  console.log(`worktree: ready at ${target} on ${branch} from ${startPoint}`);
};

const args = process.argv.slice(2);
if (args[0] === "--remove" && args[1]) {
  remove(args[1]);
} else if (args[0] && args[1] && !args[0].startsWith("-")) {
  create(...args);
} else {
  console.error(
    "usage: npm run worktree -- <name> <branch> [start-point]\n" +
      "       npm run worktree -- --remove <name>",
  );
  process.exit(2);
}
