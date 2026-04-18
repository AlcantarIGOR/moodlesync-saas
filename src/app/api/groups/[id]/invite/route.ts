import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

type Params = { params: Promise<{ id: string }> }

// POST /api/groups/[id]/invite — invite user by moodleUsername
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  // Only members can invite
  const membership = await db.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const username = typeof body?.moodleUsername === "string" ? body.moodleUsername.trim().toLowerCase() : ""
  if (!username) return NextResponse.json({ error: "moodleUsername required" }, { status: 400 })

  const target = await db.user.findUnique({ where: { moodleUsername: username } })
  if (!target) return NextResponse.json({ error: "Usuario no encontrado en MoodleSync" }, { status: 404 })

  const existing = await db.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: target.id } },
  })
  if (existing) return NextResponse.json({ error: "Ya es miembro del grupo" }, { status: 409 })

  const member = await db.studyGroupMember.create({
    data: { groupId: id, userId: target.id, role: "MEMBER" },
    include: { user: { select: { id: true, name: true, moodleUsername: true } } },
  })

  return NextResponse.json(member, { status: 201 })
}
