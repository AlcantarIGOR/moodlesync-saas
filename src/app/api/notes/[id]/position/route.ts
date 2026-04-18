import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// PATCH /api/notes/[id]/position — viewer saves their own canvas position for a shared note
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const x = typeof body.x === "number" ? Math.max(0, Math.round(body.x)) : null
  const y = typeof body.y === "number" ? Math.max(0, Math.round(body.y)) : null

  if (x === null || y === null) {
    return NextResponse.json({ error: "x and y required" }, { status: 400 })
  }

  // Verify note exists, is shared, and belongs to someone else
  const note = await db.note.findFirst({
    where: { id, shared: true, userId: { not: session.user.id } },
    select: { id: true },
  })
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.noteViewPosition.upsert({
    where: { noteId_userId: { noteId: id, userId: session.user.id } },
    create: { noteId: id, userId: session.user.id, x, y },
    update: { x, y },
  })

  return NextResponse.json({ ok: true })
}
