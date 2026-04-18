import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

type Params = { params: Promise<{ id: string }> }

// GET /api/groups/[id]/tasks
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const membership = await db.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const tasks = await db.task.findMany({
    where: { groupId: id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { dueDate: "asc" },
  })

  return NextResponse.json(tasks)
}

// POST /api/groups/[id]/tasks — create group task
export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const membership = await db.studyGroupMember.findUnique({
    where: { groupId_userId: { groupId: id, userId: session.user.id } },
  })
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })

  const task = await db.task.create({
    data: {
      userId: session.user.id,
      groupId: id,
      title: title.slice(0, 200),
      courseName: typeof body?.courseName === "string" ? body.courseName.trim() || null : null,
      dueDate: body?.dueDate ? new Date(body.dueDate) : null,
      isManual: true,
    },
    include: { user: { select: { id: true, name: true } } },
  })

  return NextResponse.json(task, { status: 201 })
}
