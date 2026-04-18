import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { NotesBoard } from "@/components/dashboard/notes-board"
import type { SharedNote } from "@/components/dashboard/notes-board"

export default async function NotasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  // User's enrolled courses (via synced tasks)
  const enrolledRaw = await db.task.findMany({
    where: { userId, courseId: { not: null }, courseName: { not: null } },
    select: { courseId: true, courseName: true },
    distinct: ["courseId"],
  })
  const courses = enrolledRaw.map((t) => ({ id: t.courseId!, name: t.courseName! }))
  const courseIds = courses.map((c) => c.id)

  const [notes, sharedRaw] = await Promise.all([
    db.note.findMany({
      where: { userId },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    }),
    courseIds.length > 0
      ? db.note.findMany({
          where: {
            shared: true,
            courseId: { in: courseIds },
            userId: { not: userId },
          },
          include: {
            user: { select: { name: true } },
            viewPositions: { where: { userId }, take: 1 },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ])

  const sharedNotes: SharedNote[] = sharedRaw.map((note) => ({
    id: note.id,
    userId: note.userId,
    content: note.content,
    color: note.color,
    pinned: note.pinned,
    courseId: note.courseId,
    courseName: note.courseName,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    authorName: note.user.name,
    viewX: note.viewPositions[0]?.x ?? null,
    viewY: note.viewPositions[0]?.y ?? null,
  }))

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div
        className="flex items-center gap-3 px-5 shrink-0"
        style={{
          height: 54,
          borderBottom: "1px solid var(--b1)",
          background: "rgba(10,10,11,.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span
          className="text-[15px] font-semibold"
          style={{ color: "var(--tx)", letterSpacing: "-.3px" }}
        >
          Notas
        </span>
        <span
          className="text-[11px]"
          style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}
        >
          — arrastra para mover
        </span>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <NotesBoard
          initialNotes={notes}
          initialSharedNotes={sharedNotes}
          courses={courses}
          userId={userId}
        />
      </div>
    </div>
  )
}
