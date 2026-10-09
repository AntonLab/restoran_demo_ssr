import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";

const runNode = (...args: string[]) =>
  execFileSync(
    process.execPath,
    [
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      "--import",
      "./scripts/register-alias.mjs",
      ...args,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  ).trim();
const run = (code: string) => runNode("--input-type=module", "-e", code);

test("a relative extensionless import resolves to the sibling .ts file", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "runner-rel-"));
  writeFileSync(path.join(dir, "dep.ts"), "export const value: string = 'rel-ok';");
  const main = path.join(dir, "main.ts");
  writeFileSync(main, "import { value } from './dep'; console.log(value);");
  expect(runNode(main)).toBe("rel-ok");
});

test("a relative directory import falls back to its index.ts", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "runner-idx-"));
  mkdirSync(path.join(dir, "pkg"));
  writeFileSync(path.join(dir, "pkg", "index.ts"), "export const value: string = 'idx-ok';");
  const main = path.join(dir, "main.ts");
  writeFileSync(main, "import { value } from './pkg'; console.log(value);");
  expect(runNode(main)).toBe("idx-ok");
});

test("Node resolves the @/ alias and strips types from src modules", () => {
  expect(run('import { WEEKDAYS } from "@/lib/weekdays"; console.log(WEEKDAYS.length)')).toBe("7");
});

test("alias paths without an extension resolve to .ts", () => {
  expect(run('import { roundRating } from "@/lib/ratings"; console.log(roundRating(4.25))')).toBe(
    "4.3",
  );
});

test("a package import still resolves normally", () => {
  expect(run('import { z } from "zod"; console.log(typeof z.object)')).toBe("function");
});
