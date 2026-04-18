import { auth } from "@/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

// GET /api/notes/shared — shared notes from classmates in the same courses
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Courses this user is enrolled in (via synced tasks)
  const enrolledCourses = await db.task.findMany({
    where: { userId: session.user.id, courseId: { not: null } },
    select: { courseId: true },
    distinct: ["courseId"],
  })
  const courseIds = enrolledCourses.map((t) => t.courseId).filter(Boolean) as number[]

  if (courseIds.length === 0) return NextResponse.json([])

  const raw = await db.note.findMany({
    where: {
      shared: true,
      courseId: { in: courseIds },
      userId: { not: session.user.id },
    },
    include: {
      user: { select: { name: true } },
      viewPositions: {
        where: { userId: session.user.id },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const notes = raw.map((note) => ({
    id: note.id,
    userId: note.userId,
    content: note.content,
    color: note.color,
    pinned: note.pinned,
    courseId: note.courseId,
    courseName: note.courseName,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    authorName: note.user.name,
    viewX: note.viewPositions[0]?.x ?? null,
    viewY: note.viewPositions[0]?.y ?? null,
  }))

  return NextResponse.json(notes)
}
