import { existsSync } from "node:fs";
import { extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Node strips types from .ts but resolves neither the `@/` alias nor extensionless paths.
function withTsExtension(url) {
  const file = fileURLToPath(url);
  for (const candidate of [`${file}.ts`, `${file}/index.ts`]) {
    if (existsSync(candidate)) return pathToFileURL(candidate);
  }
  return undefined;
}

export async function resolve(specifier, context, nextResolve) {
  let url;
  if (specifier.startsWith("@/")) {
    url = new URL(`../src/${specifier.slice(2)}`, import.meta.url);
  } else if (/^\.\.?\//.test(specifier) && !extname(specifier) && context.parentURL) {
    url = new URL(specifier, context.parentURL);
  }
  const resolved = url && withTsExtension(url);
  return nextResolve(resolved ? resolved.href : (url?.href ?? specifier), context);
}
