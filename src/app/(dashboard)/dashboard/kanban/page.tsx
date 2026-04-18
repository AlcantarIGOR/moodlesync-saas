import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { KanbanBoard } from "@/components/dashboard/kanban-board"
import { SyncButton } from "@/components/dashboard/sync-button"
import { syncUserTasks } from "@/lib/sync"

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<{ sem?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { sem } = await searchParams
  const semNum = sem ? parseInt(sem) : 0

  let tasks = await db.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  })

  // Auto-sync on first visit
  if (tasks.length === 0 && session.moodleToken && session.moodleUserId) {
    try {
      await syncUserTasks(session.user.id, session.moodleToken, session.moodleUserId)
      tasks = await db.task.findMany({
        where: { userId: session.user.id },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      })
    } catch {
      // silent
    }
  }

  if (semNum > 0) {
    tasks = tasks.filter((t) => t.isManual || t.semester === semNum || t.semester === 0)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "var(--bg-glass)", backdropFilter: "blur(10px)" }}>
        <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>
          Kanban
        </span>
        <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
          — arrastra para cambiar estado
        </span>
        <div className="flex-1" />
        <SyncButton />
      </div>

      <div className="flex-1 overflow-hidden p-5">
        <KanbanBoard initialTasks={tasks} />
      </div>
    </div>
  )
}
