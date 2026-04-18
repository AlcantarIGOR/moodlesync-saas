import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

type Params = { params: Promise<{ id: string }> }

// GET /api/groups/[id] — group detail with members and tasks
export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const group = await db.studyGroup.findFirst({
    where: {
      id,
      OR: [
        { createdBy: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, moodleUsername: true } },
      members: {
        include: { user: { select: { id: true, name: true, moodleUsername: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        where: { status: { not: "ARCHIVED" } },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { dueDate: "asc" },
      },
    },
  })

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(group)
}

// DELETE /api/groups/[id] — delete group (owner only)
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const group = await db.studyGroup.findFirst({
    where: { id, createdBy: session.user.id },
  })
  if (!group) return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 })

  await db.studyGroup.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
