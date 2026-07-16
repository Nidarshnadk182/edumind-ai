// ─────────────────────────────────────────────────────────
// In-memory rate limiter for AI endpoints.
// Good enough for a single-instance demo deployment; swap for
// a Redis/Upstash-backed limiter before scaling to multiple
// serverless instances in production.
// ─────────────────────────────────────────────────────────

const buckets = new Map<string, { count: number; resetAt: number }>();

const MAX_REQUESTS = Number(process.env.AI_RATE_LIMIT_MAX ?? 20);
const WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 3_600_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - bucket.count, resetAt: bucket.resetAt };
}
