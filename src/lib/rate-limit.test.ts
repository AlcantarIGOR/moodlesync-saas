import { describe, it, expect, beforeEach } from "vitest"
import { checkRateLimit, clearRateLimits } from "./rate-limit"

describe("Rate Limiter", () => {
  beforeEach(() => {
    clearRateLimits()
  })

  it("should allow requests under the limit", () => {
    const limit = 3
    const windowMs = 1000

    for (let i = 0; i < limit; i++) {
      const res = checkRateLimit("test-key", limit, windowMs)
      expect(res.success).toBe(true)
      expect(res.remaining).toBe(limit - 1 - i)
    }
  })

  it("should reject requests exceeding the limit", () => {
    const limit = 2
    const windowMs = 1000

    expect(checkRateLimit("test-key", limit, windowMs).success).toBe(true)
    expect(checkRateLimit("test-key", limit, windowMs).success).toBe(true)
    
    const failedRes = checkRateLimit("test-key", limit, windowMs)
    expect(failedRes.success).toBe(false)
    expect(failedRes.remaining).toBe(0)
  })

  it("should reset rate limit after window expires", async () => {
    const limit = 1
    const windowMs = 10 // Short window for testing

    expect(checkRateLimit("test-key", limit, windowMs).success).toBe(true)
    expect(checkRateLimit("test-key", limit, windowMs).success).toBe(false)

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, windowMs + 2))

    expect(checkRateLimit("test-key", limit, windowMs).success).toBe(true)
  })
})
