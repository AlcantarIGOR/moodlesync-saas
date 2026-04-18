import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// GET /api/groups — list groups where user is owner or member
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const groups = await db.studyGroup.findMany({
    where: {
      OR: [
        { createdBy: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, moodleUsername: true } },
      members: {
        include: { user: { select: { id: true, name: true, moodleUsername: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(groups)
}

// POST /api/groups — create group
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

  const materia = typeof body?.materia === "string" ? body.materia.trim() || null : null

  const group = await db.studyGroup.create({
    data: {
      name: name.slice(0, 60),
      materia: materia?.slice(0, 60) ?? null,
      createdBy: session.user.id,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: {
      owner: { select: { id: true, name: true, moodleUsername: true } },
      members: {
        include: { user: { select: { id: true, name: true, moodleUsername: true } } },
      },
      _count: { select: { tasks: true } },
    },
  })

  return NextResponse.json(group, { status: 201 })
}
