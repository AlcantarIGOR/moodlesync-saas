import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { syncUserTasks } from "@/lib/sync"
import { SyncButton } from "@/components/dashboard/sync-button"
import { TaskList } from "@/components/dashboard/task-list"

export default async function TareasPage({
  searchParams,
}: {
  searchParams: Promise<{ sem?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { sem } = await searchParams
  const semNum = sem ? parseInt(sem) : 0

  // Auto-archive PENDING tasks overdue by more than 10 days (fire-and-forget)
  void db.task.updateMany({
    where: {
      userId: session.user.id,
      status: "PENDING",
      dueDate: { lt: new Date(new Date().getTime() - 10 * 86400000) },
    },
    data: { status: "ARCHIVED" },
  }).catch(() => {})

  // Auto-sync on first load (when user has no tasks yet)
  let tasks = await db.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  })

  if (tasks.length === 0 && session.moodleToken && session.moodleUserId) {
    try {
      await syncUserTasks(session.user.id, session.moodleToken, session.moodleUserId)
      tasks = await db.task.findMany({
        where: { userId: session.user.id },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      })
    } catch {
      // Sync failed silently — user can retry manually
    }
  }

  // Apply semester filter (manual tasks always shown)
  if (semNum > 0) {
    tasks = tasks.filter((t) => t.isManual || t.semester === semNum || t.semester === 0)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "var(--bg-glass)", backdropFilter: "blur(10px)" }}>
        <span className="text-[15px] font-semibold shrink-0" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>
          Todas las tareas
        </span>
        <div className="flex-1" />
        <a
          href="/api/tasks/export"
          download="moodlesync-tareas.ics"
          className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-xs transition-all"
          style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", textDecoration: "none" }}
          title="Exportar a Google Calendar / Apple Calendar"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1 5h10" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 0v3M8 0v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          .ics
        </a>
        <SyncButton />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <TaskList tasks={tasks} moodleBaseUrl={process.env.MOODLE_BASE_URL} />
      </div>
    </div>
  )
}
