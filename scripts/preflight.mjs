/**
 * SessionStart preflight: names the environment gaps that used to surface only
 * as failed runs: a worktree without `.env.local`, a Node major other than
 * `.nvmrc`, a stopped MongoDB.
 *
 *   node scripts/preflight.mjs
 *
 * Prints one line per gap and nothing when ready; always exits 0, so a
 * session is never blocked. Tests use mongodb-memory-server, so a stopped
 * MongoDB only blocks the app, the seed and `ui-checker`.
 */
import { existsSync, readFileSync } from "node:fs";
import { connect } from "node:net";
import { join } from "node:path";
import { parseEnv } from "node:util";

const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const gaps = [];

const reachable = (host, port) =>
  new Promise((resolve) => {
    const socket = connect({ host, port, timeout: 1500 });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });

const wanted = readFileSync(join(root, ".nvmrc"), "utf8").trim().replace(/^v/, "").split(".")[0];
const running = process.versions.node.split(".")[0];
if (running !== wanted)
  gaps.push(
    `Node ${process.versions.node} runs, \`.nvmrc\` wants ${wanted}: run \`nvm use ${wanted}\`.`,
  );

const envFile = join(root, ".env.local");
if (!existsSync(envFile)) {
  gaps.push("`.env.local` is missing. Create worktrees with `npm run worktree`, which copies it.");
} else {
  const uri = parseEnv(readFileSync(envFile, "utf8")).MONGODB_URI ?? "";
  // A `mongodb+srv://` URI names no port; only a plain host is probed.
  if (uri.startsWith("mongodb://")) {
    const { hostname, port } = new URL(uri);
    if (!(await reachable(hostname, Number(port || 27017))))
      gaps.push(
        `MongoDB at ${hostname}:${port || 27017} does not answer. Start it before the app, the seed or ui-checker.`,
      );
  }
}

if (gaps.length) console.log(`preflight:\n- ${gaps.join("\n- ")}`);
