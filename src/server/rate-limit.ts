type Options = { limit: number; windowMs: number; now?: () => number };

export type Limiter = ReturnType<typeof createRateLimiter>;

export function formatRetry(retryAfterMs: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterMs / 60_000));
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

// In-memory by design: one Node process, no persistence across restarts.
export function createRateLimiter({ limit, windowMs, now = Date.now }: Options) {
  const hits = new Map<string, number[]>();

  return {
    hit(key: string): { ok: boolean; retryAfterMs: number } {
      const current = now();
      // Keys never hit again would otherwise stay forever, one per distinct IP.
      // ponytail: O(keys) scan per hit, sweep less often if the map gets large.
      for (const [k, times] of hits) {
        if (k !== key && times[times.length - 1] <= current - windowMs) hits.delete(k);
      }
      const recent = (hits.get(key) ?? []).filter((t) => t > current - windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterMs: recent[0] + windowMs - current };
      }
      recent.push(current);
      hits.set(key, recent);
      return { ok: true, retryAfterMs: 0 };
    },
    // Test-only: lets tests observe pruning.
    size: () => hits.size,
  };
}
