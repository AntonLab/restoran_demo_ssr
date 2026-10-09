// Blocks open redirects: protocol-relative URLs, backslash tricks and control characters.
export function safeNext(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (ch === "\\" || code < 0x20 || code === 0x7f) return "/";
  }
  return value;
}

export function postLoginPath(next: unknown, role: "user" | "admin"): string {
  if (typeof next === "string" && next !== "") return safeNext(next);
  return role === "admin" ? "/admin" : "/account";
}
