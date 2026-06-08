import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// PATCH /api/notes/[id] — update content, color, position, or pinned
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Build update payload from allowed fields only
  const data: Record<string, unknown> = {}
  if (typeof body.content === "string") data.content = body.content.slice(0, 500)
  if (typeof body.color === "string" && ["yellow", "blue", "green", "pink", "purple"].includes(body.color)) {
    data.color = body.color
  }
  if (typeof body.x === "number") data.x = Math.max(0, Math.round(body.x))
  if (typeof body.y === "number") data.y = Math.max(0, Math.round(body.y))
  if (typeof body.pinned === "boolean") data.pinned = body.pinned

  const note = await db.note.updateMany({
    where: { id, userId: session.user.id },
    data,
  })

  if (note.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ ok: true })
}

// DELETE /api/notes/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  await db.note.deleteMany({ where: { id, userId: session.user.id } })

  return NextResponse.json({ ok: true })
}
