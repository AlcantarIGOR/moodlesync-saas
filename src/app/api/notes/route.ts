import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// GET /api/notes — list user notes
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notes = await db.note.findMany({
    where: { userId: session.user.id },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(notes)
}

// POST /api/notes — create note
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { content = "", color = "yellow", x = 100, y = 100 } = body

  const note = await db.note.create({
    data: {
      userId: session.user.id,
      content: String(content).slice(0, 500),
      color: ["yellow", "blue", "green", "pink", "purple"].includes(color) ? color : "yellow",
      x: Math.max(0, Math.round(Number(x) || 100)),
      y: Math.max(0, Math.round(Number(y) || 100)),
    },
  })

  return NextResponse.json(note, { status: 201 })
}
