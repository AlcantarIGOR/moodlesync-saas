import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { syncUserTasks } from "@/lib/sync"
import { SyncButton } from "@/components/dashboard/sync-button"
import { DashboardStats, ProximasGrid } from "@/components/dashboard/dashboard-stats"
import Link from "next/link"
import type { ClassSession } from "@prisma/client"

// Vencida: pasó la fecha, max 10 días atrás (después se auto-archiva)
function isOverdue(date: Date | null) {
  if (!date) return false
  const due = new Date(date).getTime()
  const now = Date.now()
  return due < now && (now - due) <= 10 * 86400000
}
// Urgente: vence en los próximos 7 días (aún no pasado)
function isUrgent(date: Date | null) {
  if (!date) return false
  const t = new Date(date).getTime()
  return t >= Date.now() && t < Date.now() + 7 * 86400000
}

export default async function DashboardPage({
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
    where: { userId: session.user.id, status: "PENDING", dueDate: { lt: new Date(Date.now() - 10 * 86400000) } },
    data: { status: "ARCHIVED" },
  }).catch(() => {})

  // Auto-sync on first visit
  let allTasks = await db.task.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  })

  if (allTasks.length === 0 && session.moodleToken && session.moodleUserId) {
    try {
      await syncUserTasks(session.user.id, session.moodleToken, session.moodleUserId)
      allTasks = await db.task.findMany({
        where: { userId: session.user.id },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      })
    } catch { /* silent */ }
  }

  // Apply semester filter
  const tasks = semNum > 0
    ? allTasks.filter((t) => t.semester === semNum || t.semester === 0 || t.isManual)
    : allTasks

  const active = tasks.filter((t) => t.status !== "ARCHIVED")
  const total      = active.length
  const completadas = active.filter((t) => t.status === "DONE").length
  const pendientes  = active.filter((t) => t.status === "PENDING" && !isOverdue(t.dueDate) && !isUrgent(t.dueDate)).length
  const urgentes    = active.filter((t) => t.status === "PENDING" && isUrgent(t.dueDate)).length
  const vencidas    = active.filter((t) => t.status === "PENDING" && isOverdue(t.dueDate)).length
  const pct = total > 0 ? Math.round((completadas / total) * 100) : 0

  // Urgentes y vencidas primero, luego pendientes normales
  const proximas = [
    ...active.filter((t) => t.status === "PENDING" && isOverdue(t.dueDate)),
    ...active.filter((t) => t.status === "PENDING" && t.dueDate && isUrgent(t.dueDate)),
    ...active.filter((t) => t.status === "PENDING" && t.dueDate && !isOverdue(t.dueDate) && !isUrgent(t.dueDate)),
  ].slice(0, 5)

  // ── Clase ahora ──
  // Vercel corre en UTC — usar hora de México para comparar con los horarios de Mindbox
  const schedule = await db.classSession.findMany({ where: { userId: session.user.id } })
  function toMins(t: string | null | undefined): number {
    if (!t) return 0
    const [h, m] = t.split(":").map(Number)
    return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m)
  }
  const nowMX   = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }))
  const nowDay  = (() => { const d = nowMX.getDay(); return d === 0 ? 6 : d - 1 })()
  const nowMins = nowMX.getHours() * 60 + nowMX.getMinutes()
  const activeClass = schedule.find(
    (s: ClassSession) => s.dayOfWeek === nowDay && toMins(s.startTime) <= nowMins && toMins(s.endTime) > nowMins
  ) ?? null
  const nextClass = (() => {
    const today = schedule.filter((s: ClassSession) => s.dayOfWeek === nowDay && toMins(s.startTime) > nowMins)
      .sort((a: ClassSession, b: ClassSession) => toMins(a.startTime) - toMins(b.startTime))[0]
    if (today) return today
    for (let offset = 1; offset <= 6; offset++) {
      const nd = (nowDay + offset) % 7
      const ns = schedule.filter((s: ClassSession) => s.dayOfWeek === nd)
        .sort((a: ClassSession, b: ClassSession) => toMins(a.startTime) - toMins(b.startTime))[0]
      if (ns) return ns
    }
    return null
  })()

  // Vista dual: si quedan ≤15 min para terminar la clase actual Y hay siguiente clase
  const minsUntilClassEnd = activeClass ? toMins(activeClass.endTime) - nowMins : Infinity
  const showDual = !!(activeClass && nextClass && minsUntilClassEnd <= 15)

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "rgba(10,10,11,.85)", backdropFilter: "blur(10px)" }}>
        <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>Dashboard</span>
        <div className="flex-1" />
        <SyncButton />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">

        {/* ── STAT CARDS ── */}
        <DashboardStats
          total={total}
          completadas={completadas}
          pendientes={pendientes}
          urgentes={urgentes}
          vencidas={vencidas}
          pct={pct}
        />

        {/* ── CLASE AHORA ── vista dual cuando quedan ≤15 min */}
        {(activeClass || nextClass) && (
          showDual ? (
            /* Vista dual: clase actual + próxima clase */
            <Link href="/dashboard/horario" style={{ textDecoration: "none" }}>
              <div className="rounded-2xl overflow-hidden transition-all hover:opacity-90"
                style={{ background: "var(--card)", border: "1px solid var(--green-b)" }}>

                {/* Clase actual */}
                <div className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: "1px solid var(--b1)" }}>
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[.08em]"
                      style={{ fontFamily: "var(--mono)", color: "var(--green)" }}>
                      Ahora en clase · termina en {minsUntilClassEnd}min
                    </p>
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tx)" }}>
                      {activeClass!.subjectName}
                    </p>
                    <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                      {activeClass!.startTime}–{activeClass!.endTime}
                      {activeClass!.room ? ` · Aula ${activeClass!.room}` : ""}
                    </p>
                  </div>
                </div>

                {/* Próxima clase */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--amber)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[.08em]"
                      style={{ fontFamily: "var(--mono)", color: "var(--amber)" }}>
                      Próxima · en {toMins(nextClass!.startTime) - nowMins}min
                    </p>
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tx)" }}>
                      {nextClass!.subjectName}
                    </p>
                    <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                      {nextClass!.startTime}–{nextClass!.endTime}
                      {nextClass!.room ? ` · Aula ${nextClass!.room}` : ""}
                    </p>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" style={{ color: "var(--tx3)" }}>
                    <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </Link>
          ) : (
            /* Vista simple: solo clase actual o próxima */
            <Link href="/dashboard/horario" style={{ textDecoration: "none" }}>
              <div className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:opacity-90"
                style={{ background: "var(--card)", border: `1px solid ${activeClass ? "var(--green-b)" : "var(--b1)"}` }}>
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: activeClass ? "var(--green)" : "var(--amber)", boxShadow: activeClass ? "0 0 6px var(--green)" : "none" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-[.08em]"
                    style={{ fontFamily: "var(--mono)", color: activeClass ? "var(--green)" : "var(--amber)" }}>
                    {activeClass ? "Ahora en clase" : "Próxima clase"}
                  </p>
                  <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tx)" }}>
                    {(activeClass ?? nextClass)!.subjectName}
                  </p>
                  <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                    {(activeClass ?? nextClass)!.startTime}–{(activeClass ?? nextClass)!.endTime}
                    {(activeClass ?? nextClass)!.room ? ` · Aula ${(activeClass ?? nextClass)!.room}` : ""}
                  </p>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0" style={{ color: "var(--tx3)" }}>
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
          )
        )}

        {/* ── PRÓXIMAS A VENCER ── */}
        <ProximasGrid tasks={proximas} semNum={semNum} total={total} />

        {/* ── RESUMEN INTELIGENTE ── */}
        {(() => {
          // Build context-aware insight messages
          type Insight = { dot: string; text: React.ReactNode; time: string }
          const insights: Insight[] = []

          // Critical: overdue tasks
          if (vencidas > 0) {
            insights.push({
              dot: "var(--red)",
              text: <>Tienes <strong style={{ color: "var(--tx)" }}>{vencidas} tarea{vencidas !== 1 ? "s" : ""} vencida{vencidas !== 1 ? "s" : ""}</strong> — entréga{vencidas !== 1 ? "las" : "la"} lo antes posible</>,
              time: "Requiere atención inmediata",
            })
          }

          // Most urgent upcoming task
          const nextTask = proximas[0]
          if (nextTask) {
            const daysLeft = nextTask.dueDate
              ? Math.floor((new Date(nextTask.dueDate).getTime() - Date.now()) / 86400000)
              : null
            const whenStr = daysLeft === 0 ? "hoy" : daysLeft === 1 ? "mañana" : `en ${daysLeft}d`
            insights.push({
              dot: urgentes > 0 ? "var(--amber)" : "var(--blue)",
              text: <>La entrega más próxima es <strong style={{ color: "var(--tx)" }}>{nextTask.title}</strong> — vence {whenStr}</>,
              time: nextTask.courseName ?? "Tarea pendiente",
            })
          }

          // Upcoming count this week
          if (urgentes > 1) {
            insights.push({
              dot: "var(--amber)",
              text: <>Tienes <strong style={{ color: "var(--tx)" }}>{urgentes} entregas</strong> esta semana — organiza tu tiempo</>,
              time: "Próximos 3 días",
            })
          }

          // Completion encouragement
          if (pct >= 80 && completadas > 0) {
            insights.push({
              dot: "var(--green)",
              text: <>Vas excelente — completaste el <strong style={{ color: "var(--green)" }}>{pct}%</strong> de tus tareas</>,
              time: `${completadas} de ${total} entregadas`,
            })
          } else if (pct >= 50 && completadas > 0) {
            insights.push({
              dot: "var(--green)",
              text: <>Llevas el <strong style={{ color: "var(--tx)" }}>{pct}%</strong> completado — {pendientes} tarea{pendientes !== 1 ? "s" : ""} pendiente{pendientes !== 1 ? "s" : ""} por entregar</>,
              time: `${completadas} de ${total} entregadas`,
            })
          } else if (total === 0) {
            insights.push({
              dot: "var(--blue)",
              text: <><strong style={{ color: "var(--tx)" }}>Sin tareas cargadas</strong> — presiona Sincronizar para cargar desde Moodle</>,
              time: "Primer uso",
            })
          }

          // Class context
          if (activeClass) {
            insights.push({
              dot: "var(--green)",
              text: <>Estás en <strong style={{ color: "var(--tx)" }}>{activeClass.subjectName}</strong> ahora — {activeClass.startTime}–{activeClass.endTime}</>,
              time: activeClass.room ? `Aula ${activeClass.room}` : "En clase",
            })
          } else if (nextClass && !insights.find((i) => i.dot === "var(--blue)" && total > 0)) {
            const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
            const sameDay = nextClass.dayOfWeek === nowDay
            insights.push({
              dot: "var(--blue)",
              text: <>Próxima clase: <strong style={{ color: "var(--tx)" }}>{nextClass.subjectName}</strong> — {nextClass.startTime}{!sameDay ? ` (${days[nextClass.dayOfWeek]})` : ""}</>,
              time: "Horario",
            })
          }

          if (insights.length === 0) return null

          return (
            <div>
              <p className="text-[11px] uppercase tracking-[.1em] mb-3" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Resumen
              </p>
              <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
                {insights.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3"
                    style={{ borderBottom: i < insights.length - 1 ? "1px solid var(--b1)" : "none" }}>
                    <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: item.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] leading-relaxed" style={{ color: "var(--tx2)" }}>{item.text}</p>
                      <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}
