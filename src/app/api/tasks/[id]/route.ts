import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import type { TaskStatus } from "@prisma/client"

const VALID_STATUSES: TaskStatus[] = ["PENDING", "DONE", "ARCHIVED"]

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const status: TaskStatus = body?.status

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const task = await db.task.findUnique({ where: { id } })

  if (!task || task.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await db.task.update({
    where: { id },
    data: { status },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const task = await db.task.findUnique({ where: { id } })

  if (!task || task.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await db.task.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
