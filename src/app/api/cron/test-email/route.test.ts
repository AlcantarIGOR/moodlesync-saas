import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    task: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/email", () => ({
  sendReminderEmail: vi.fn(),
}))

import { auth } from "@/auth"
import { GET } from "./route"

describe("GET /api/cron/test-email", () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalAdminId = process.env.ADMIN_USER_ID

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...process.env, NODE_ENV: "production", ADMIN_USER_ID: "admin-id" }
  })

  it("returns 403 in production for non-admin users", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "not-admin" } } as never)

    const res = await GET()
    const payload = await res.json()

    expect(res.status).toBe(403)
    expect(payload.error).toBe("Forbidden")
  })

  it("returns 401 when unauthenticated", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const res = await GET()
    expect(res.status).toBe(401)
  })

  afterEach(() => {
    process.env = {
      ...process.env,
      NODE_ENV: originalNodeEnv,
      ADMIN_USER_ID: originalAdminId,
    }
  })
})
