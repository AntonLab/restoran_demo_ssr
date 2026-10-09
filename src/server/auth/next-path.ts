// Blocks open redirects: protocol-relative URLs, backslash tricks and control characters.
export function safeNext(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (ch === "\\" || code < 0x20 || code === 0x7f) return "/";
  }
  return value;
}

const AUTH_PAGE = /^\/(login|register|forgot-password|reset-password)(?=[/?#]|$)/;

export function postLoginPath(next: unknown, role: "user" | "admin"): string {
  const safe = typeof next === "string" && next !== "" ? safeNext(next) : null;
  // Returning to an auth page would bounce a signed-in visitor back here in a redirect loop.
  if (safe && !AUTH_PAGE.test(safe)) return safe;
  return role === "admin" ? "/admin" : "/account";
}
