import { execFileSync } from "node:child_process";
import { expect, test } from "vitest";

const run = (code: string) =>
  execFileSync(
    process.execPath,
    [
      "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
      "--import",
      "./scripts/register-alias.mjs",
      "--input-type=module",
      "-e",
      code,
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  ).trim();

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
