type RateLimitRecord = {
  count: number
  resetAt: number
}

const cache = new Map<string, RateLimitRecord>()

/**
 * Checks if a request exceeds the specified limit within a window of time.
 * @param key Unique key for the rate limit client/action combination (e.g. `login:ip`, `sync:userId`).
 * @param limit Maximum number of requests allowed in the window.
 * @param windowMs Time window in milliseconds.
 * @returns Object indicating success/failure, remaining requests, and reset timestamp.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const record = cache.get(key)

  if (!record || now > record.resetAt) {
    cache.set(key, {
      count: 1,
      resetAt: now + windowMs,
    })
    return { success: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetAt: record.resetAt }
  }

  record.count++
  return { success: true, remaining: limit - record.count, resetAt: record.resetAt }
}

/**
 * Clears all active rate limit records. Mainly used for unit testing.
 */
export function clearRateLimits() {
  cache.clear()
}
