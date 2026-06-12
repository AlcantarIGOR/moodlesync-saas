import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/moodle", () => ({
  mCall: vi.fn(),
}))

import { auth } from "@/auth"
import { mCall } from "@/lib/moodle"
import { POST } from "./route"

describe("POST /api/moodle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when no session token is present", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    const req = new Request("http://localhost/api/moodle", {
      method: "POST",
      body: JSON.stringify({ wsfunction: "core_webservice_get_site_info" }),
      headers: { "content-type": "application/json" },
    })

    const res = await POST(req as never)
    expect(res.status).toBe(401)
  })

  it("returns 403 for wsfunction outside allowlist", async () => {
    vi.mocked(auth).mockResolvedValue({ moodleToken: "token" } as never)

    const req = new Request("http://localhost/api/moodle", {
      method: "POST",
      body: JSON.stringify({ wsfunction: "core_user_get_users" }),
      headers: { "content-type": "application/json" },
    })

    const res = await POST(req as never)
    const payload = await res.json()

    expect(res.status).toBe(403)
    expect(payload.error).toBe("wsfunction not allowed")
    expect(mCall).not.toHaveBeenCalled()
  })

  it("returns sanitized upstream error", async () => {
    vi.mocked(auth).mockResolvedValue({ moodleToken: "token" } as never)
    vi.mocked(mCall).mockRejectedValue(new Error("upstream detail"))

    const req = new Request("http://localhost/api/moodle", {
      method: "POST",
      body: JSON.stringify({ wsfunction: "core_webservice_get_site_info" }),
      headers: { "content-type": "application/json" },
    })

    const res = await POST(req as never)
    const payload = await res.json()

    expect(res.status).toBe(502)
    expect(payload.error).toBe("Upstream service error")
  })
})
