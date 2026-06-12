import { auth } from "@/auth"
import { mCall } from "@/lib/moodle"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const session = await auth()

  if (!session?.moodleToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { wsfunction: string; params?: Record<string, string | number> }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { wsfunction, params = {} } = body

  if (!wsfunction) {
    return NextResponse.json({ error: "wsfunction is required" }, { status: 400 })
  }

  // Allowlist — only permit the functions the app actually uses
  const ALLOWED_FUNCTIONS = [
    "core_webservice_get_site_info",
    "core_enrol_get_users_courses",
    "mod_assign_get_assignments",
    "gradereport_user_get_grades_table",
    "core_files_get_files",
  ]
  if (!ALLOWED_FUNCTIONS.includes(wsfunction)) {
    return NextResponse.json({ error: "wsfunction not allowed" }, { status: 403 })
  }

  try {
    const data = await mCall(session.moodleToken, wsfunction, params)
    console.log(`[api/moodle] wsfunction=${wsfunction} status=ok duration_ms=${Date.now() - startedAt}`)
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Moodle error"
    console.error(`[api/moodle] wsfunction=${wsfunction} status=error duration_ms=${Date.now() - startedAt} message=${message}`)
    return NextResponse.json({ error: "Upstream service error" }, { status: 502 })
  }
}
