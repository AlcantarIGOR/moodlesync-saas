import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.toLowerCase().trim() ?? ""

  const tasks = await db.task.findMany({
    where: {
      userId: session.user.id,
      status: { not: "ARCHIVED" },
      ...(q ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { courseName: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    select: { id: true, title: true, courseName: true, dueDate: true, status: true },
    orderBy: { dueDate: "asc" },
    take: 8,
  })

  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const title = typeof body?.title === "string" ? body.title.trim() : ""
  if (!title) {
    return NextResponse.json({ error: "Title required" }, { status: 400 })
  }

  const task = await db.task.create({
    data: {
      userId: session.user.id,
      title,
      courseName:
        typeof body?.courseName === "string"
          ? body.courseName.trim() || null
          : null,
      dueDate: body?.dueDate ? new Date(body.dueDate) : null,
      isManual: true,
    },
  })

  return NextResponse.json(task, { status: 201 })
}
