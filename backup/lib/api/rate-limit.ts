type Bucket = { tokens: number; lastRefill: number }

// In-memory token-bucket rate limiter.
// TODO: swap for Redis (@upstash/ratelimit) when scaling beyond one instance —
// in-memory state resets on cold start and does not share across regions.
const buckets = new Map<string, Bucket>()

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }

export function rateLimit(
  key: string,
  opts: { capacity: number; refillPerSec: number }
): RateLimitResult {
  const now = Date.now()
  const b = buckets.get(key) ?? { tokens: opts.capacity, lastRefill: now }
  const elapsed = (now - b.lastRefill) / 1000
  b.tokens = Math.min(opts.capacity, b.tokens + elapsed * opts.refillPerSec)
  b.lastRefill = now
  if (b.tokens < 1) {
    buckets.set(key, b)
    return { ok: false, retryAfter: Math.ceil((1 - b.tokens) / opts.refillPerSec) }
  }
  b.tokens -= 1
  buckets.set(key, b)
  return { ok: true }
}

// Test-only: clear the bucket map between tests.
export function _resetForTests(): void {
  buckets.clear()
}
