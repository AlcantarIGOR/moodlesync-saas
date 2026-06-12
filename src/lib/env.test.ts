import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { getAuthSecret, validateRequiredEnv } from "./env"

const ORIGINAL_ENV = { ...process.env }

function setProdEnv() {
  process.env = {
    ...process.env,
    NODE_ENV: "production",
    DATABASE_URL: "******127.0.0.1:5432/dummy",
    MOODLE_BASE_URL: "https://placeholder.tecnm.mx/itcg",
    CRON_SECRET: "test-secret",
    RESEND_API_KEY: "re_test",
    RESEND_FROM_EMAIL: "MoodleSync <test@example.com>",
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "vapid-public",
    VAPID_PRIVATE_KEY: "vapid-private",
    VAPID_SUBJECT: "mailto:test@example.com",
    MINDBOX_ENCRYPTION_KEY: "0000000000000000000000000000000000000000000000000000000000000000",
    AUTH_SECRET: "auth-secret",
  }
  delete process.env.NEXTAUTH_SECRET
}

describe("env.ts", () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it("prefers AUTH_SECRET over NEXTAUTH_SECRET", () => {
    process.env.AUTH_SECRET = "auth-v5"
    process.env.NEXTAUTH_SECRET = "legacy"
    expect(getAuthSecret()).toBe("auth-v5")
  })

  it("falls back to NEXTAUTH_SECRET when AUTH_SECRET is missing", () => {
    delete process.env.AUTH_SECRET
    process.env.NEXTAUTH_SECRET = "legacy"
    expect(getAuthSecret()).toBe("legacy")
  })

  it("throws in production when critical env vars are missing", () => {
    process.env = { ...process.env, NODE_ENV: "production" }
    delete process.env.AUTH_SECRET
    delete process.env.NEXTAUTH_SECRET
    delete process.env.MINDBOX_ENCRYPTION_KEY
    delete process.env.DATABASE_URL

    expect(() => validateRequiredEnv()).toThrowError(
      "[env] Missing or invalid production environment variables:"
    )
  })

  it("passes in production when all required env vars are present and valid", () => {
    setProdEnv()
    expect(() => validateRequiredEnv()).not.toThrow()
  })
})
