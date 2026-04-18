import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

type Params = { params: Promise<{ id: string; userId: string }> }

// DELETE /api/groups/[id]/members/[userId] — remove member or leave group
export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, userId } = await params

  const group = await db.studyGroup.findFirst({ where: { id } })
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = group.createdBy === session.user.id
  const isSelf = userId === session.user.id

  // Owner can remove anyone; members can only remove themselves (leave)
  if (!isOwner && !isSelf) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Owner cannot leave (must delete group)
  if (isSelf && isOwner) return NextResponse.json({ error: "El dueño no puede salir — elimina el grupo" }, { status: 400 })

  await db.studyGroupMember.delete({
    where: { groupId_userId: { groupId: id, userId } },
  })

  return NextResponse.json({ ok: true })
}
