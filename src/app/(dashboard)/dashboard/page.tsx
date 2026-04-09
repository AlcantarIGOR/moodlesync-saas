import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { syncUserTasks } from "@/lib/sync"
import { SyncButton } from "@/components/dashboard/sync-button"
import Link from "next/link"
import type { ClassSession } from "@prisma/client"

function timeLeft(date: Date | null): string {
  if (!date) return "Sin fecha"
  const diff = Math.floor((new Date(date).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `Vencida hace ${Math.abs(diff)}d`
  if (diff === 0) return "Vence hoy"
  if (diff === 1) return "Vence mañana"
  return `${diff}d restantes`
}

function isOverdue(date: Date | null) {
  return date && new Date(date).getTime() < Date.now()
}
function isUrgent(date: Date | null) {
  if (!date) return false
  const t = new Date(date).getTime()
  return t >= Date.now() && t < Date.now() + 3 * 86400000
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

  // Next 4 pending non-overdue tasks
  const proximas = active
    .filter((t) => t.status === "PENDING" && t.dueDate && !isOverdue(t.dueDate))
    .slice(0, 4)

  const COURSE_COLORS = [
    { bg: "var(--blue-d)", color: "var(--blue)" },
    { bg: "var(--purple-d)", color: "var(--purple)" },
    { bg: "var(--green-d)", color: "var(--green)" },
    { bg: "var(--amber-d)", color: "var(--amber)" },
    { bg: "var(--red-d)", color: "var(--red)" },
  ]
  function cc(name: string) {
    let h = 0
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff
    return COURSE_COLORS[h % COURSE_COLORS.length]
  }

  const semLabel = semNum > 0 ? `${semNum}° semestre` : "todos los semestres"

  // ── Clase ahora ──
  const schedule = await db.classSession.findMany({ where: { userId: session.user.id } })
  function toMins(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + (m ?? 0) }
  const nowDay = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes()
  const activeClass = schedule.find(
    (s: ClassSession) => s.dayOfWeek === nowDay && toMins(s.startTime) <= nowMins && toMins(s.endTime) > nowMins
  ) ?? null
  const nextClass = (() => {
    const today = schedule.filter((s: ClassSession) => s.dayOfWeek === nowDay && toMins(s.startTime) > nowMins)
      .sort((a: ClassSession, b: ClassSession) => toMins(a.startTime) - toMins(b.startTime))[0]
    if (today) return today
    for (let offset = 1; offset <= 6; offset++) {
      const nd = (nowDay + offset) % 7
      const ns = schedule.filter((s: ClassSession) => s.dayOfWeek === nd).sort((a: ClassSession, b: ClassSession) => toMins(a.startTime) - toMins(b.startTime))[0]
      if (ns) return ns
    }
    return null
  })()

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
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total */}
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Total</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--blue-d)" }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h10M2 7h6M2 10h8" stroke="var(--blue)" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx)" }}>{total}</p>
            <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>tareas en total</p>
            {/* Progress bar */}
            <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--blue)" }} />
            </div>
            <p className="text-[10px] mt-1" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>{pct}% completado</p>
          </div>

          {/* Completadas */}
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Completadas</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--green-d)" }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="var(--green)" strokeWidth="1.3"/>
                  <path d="M4.5 7l2 2 3.5-3.5" stroke="var(--green)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--green)" }}>
              {completadas}
            </p>
            <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>del {semLabel}</p>
          </div>

          {/* Pendientes */}
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Pendientes</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--amber-d)" }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="var(--amber)" strokeWidth="1.3"/>
                  <path d="M7 4.5v3l1.5 1.5" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--amber)" }}>{pendientes}</p>
            <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>por entregar</p>
          </div>

          {/* Urgentes + Vencidas */}
          <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: `1px solid ${vencidas > 0 ? "var(--red-b)" : "var(--b1)"}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Urgentes</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--red-d)" }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5L1.5 12.5h11L7 1.5z" stroke="var(--red)" strokeWidth="1.3" strokeLinejoin="round"/>
                  <path d="M7 5.5v3M7 10v.5" stroke="var(--red)" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--red)" }}>{urgentes + vencidas}</p>
            <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              {vencidas > 0 ? `${vencidas} vencida${vencidas !== 1 ? "s" : ""} · atención inmediata` : "atención inmediata"}
            </p>
          </div>
        </div>

        {/* ── CLASE AHORA ── */}
        {(activeClass || nextClass) && (
          <Link href="/dashboard/horario" style={{ textDecoration: "none" }}>
            <div className="rounded-2xl p-4 flex items-center gap-3 transition-all hover:opacity-90"
              style={{ background: "var(--card)", border: `1px solid ${activeClass ? "var(--green-b)" : "var(--b1)"}` }}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${activeClass ? "" : ""}`}
                style={{ background: activeClass ? "var(--green)" : "var(--amber)", boxShadow: activeClass ? "0 0 6px var(--green)" : "none" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[.08em]" style={{ fontFamily: "var(--mono)", color: activeClass ? "var(--green)" : "var(--amber)" }}>
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
        )}

        {/* ── PRÓXIMAS A VENCER ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Próximas a vencer
            </p>
            <Link href={semNum > 0 ? `/dashboard/tareas?sem=${semNum}` : "/dashboard/tareas"}
              className="text-[11px] transition-all hover:opacity-80"
              style={{ fontFamily: "var(--mono)", color: "var(--blue)", textDecoration: "none" }}>
              Ver todas →
            </Link>
          </div>

          {proximas.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
              <p className="text-xs" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                {total === 0 ? "Sin tareas — sincroniza para cargar" : "Sin tareas próximas pendientes"}
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
              {proximas.map((t) => {
                const c = t.courseName ? cc(t.courseName) : { bg: "var(--blue-d)", color: "var(--blue)" }
                const urgent = isUrgent(t.dueDate)
                return (
                  <div key={t.id} className="rounded-xl p-4" style={{ background: "var(--card)", border: `1px solid ${urgent ? "var(--amber-b)" : "var(--b1)"}` }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="rounded px-2 py-0.5 text-[10px] font-medium shrink-0"
                        style={{ fontFamily: "var(--mono)", background: c.bg, color: c.color }}>
                        {t.courseName?.split(/\s+/).slice(-1)[0]?.slice(0, 10) ?? "—"}
                      </span>
                      <span className="text-[10px] shrink-0" style={{ fontFamily: "var(--mono)", color: urgent ? "var(--amber)" : "var(--tx2)" }}>
                        {timeLeft(t.dueDate)}
                      </span>
                    </div>
                    <p className="text-[13px] font-medium leading-snug" style={{ color: "var(--tx)" }}>{t.title}</p>
                    {t.courseName && (
                      <p className="text-[11px] mt-1 line-clamp-1" style={{ color: "var(--tx2)" }}>{t.courseName}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

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
