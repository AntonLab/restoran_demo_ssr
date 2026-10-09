type Options = { limit: number; windowMs: number; now?: () => number };

// In-memory by design: one Node process, no persistence across restarts.
export function createRateLimiter({ limit, windowMs, now = Date.now }: Options) {
  const hits = new Map<string, number[]>();

  return {
    hit(key: string): { ok: boolean; retryAfterMs: number } {
      const current = now();
      const recent = (hits.get(key) ?? []).filter((t) => t > current - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: recent[0] + windowMs - current };
      }
      recent.push(current);
      hits.set(key, recent);
      return { ok: true, retryAfterMs: 0 };
    },
  };
}
