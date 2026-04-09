import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { syncUserTasks } from "@/lib/sync"

export async function POST() {
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
    return NextResponse.json({ synced })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown sync error"
    console.error("[sync] syncUserTasks failed:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
