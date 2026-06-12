import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    task: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    pushSubscription: {
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/email", () => ({
  sendReminderEmail: vi.fn(),
}))

vi.mock("@/lib/push", () => ({
  sendPush: vi.fn(),
}))

import { db } from "@/lib/db"
import { GET } from "./route"

describe("GET /api/cron/reminders", () => {
  const originalNodeEnv = process.env.NODE_ENV
  const originalCronSecret = process.env.CRON_SECRET

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...process.env, NODE_ENV: "production", CRON_SECRET: "cron-secret" }
    vi.mocked(db.task.findMany).mockResolvedValue([])
  })

  it("returns 500 when CRON_SECRET is missing in production", async () => {
    delete process.env.CRON_SECRET

    const res = await GET(new Request("http://localhost/api/cron/reminders"))
    const payload = await res.json()

    expect(res.status).toBe(500)
    expect(payload.error).toBe("Server misconfiguration")
  })

  it("returns 401 when authorization header is invalid", async () => {
    const res = await GET(new Request("http://localhost/api/cron/reminders"))
    const payload = await res.json()

    expect(res.status).toBe(401)
    expect(payload.error).toBe("Unauthorized")
  })

  it("allows development mode without secret and returns empty window response", async () => {
    process.env = { ...process.env, NODE_ENV: "development" }
    delete process.env.CRON_SECRET

    const res = await GET(new Request("http://localhost/api/cron/reminders"))
    const payload = await res.json()

    expect(res.status).toBe(200)
    expect(payload.sent).toBe(0)
  })

  afterEach(() => {
    process.env = {
      ...process.env,
      NODE_ENV: originalNodeEnv,
      CRON_SECRET: originalCronSecret,
    }
  })
})
