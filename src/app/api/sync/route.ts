import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { syncUserTasks } from "@/lib/sync"

export async function POST() {
  const startedAt = Date.now()
  const session = await auth()

  if (!session?.user?.id || !session.moodleToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!session.moodleUserId) {
    return NextResponse.json({ error: "Missing Moodle user ID" }, { status: 400 })
  }

  try {
    const synced = await syncUserTasks(
      session.user.id,
      session.moodleToken,
      session.moodleUserId
    )
    console.log(`[api/sync] userId=${session.user.id} synced=${synced} duration_ms=${Date.now() - startedAt}`)
    return NextResponse.json({ synced })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error"
    console.error(`[api/sync] userId=${session.user.id} status=error duration_ms=${Date.now() - startedAt} message=${message}`)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
