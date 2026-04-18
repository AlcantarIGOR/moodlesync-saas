import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids, action } = await req.json() as { ids: unknown; action: unknown }

  if (!Array.isArray(ids) || ids.length === 0 || (action !== "done" && action !== "archive")) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const status = action === "done" ? "DONE" : "ARCHIVED"

  const { count } = await db.task.updateMany({
    where: {
      id: { in: ids as string[] },
      userId: session.user.id,
    },
    data: { status },
  })

  return NextResponse.json({ updated: count })
}
