import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import type { Task, ClassSession } from "@prisma/client"
import { WeekNav } from "@/components/dashboard/week-nav"
import { CurrentTimeLine } from "@/components/dashboard/current-time-line"
import Link from "next/link"
import { Suspense } from "react"

// ── Constantes del time-grid ──────────────────────────────────
const HOUR_PX      = 64          // px por hora
const GRID_START_H = 7           // 07:00
const GRID_END_H   = 21          // 21:00
const GRID_START_MIN = GRID_START_H * 60
const GRID_TOTAL_MIN = (GRID_END_H - GRID_START_H) * 60
const GRID_HEIGHT    = GRID_TOTAL_MIN * HOUR_PX / 60   // 896px

function minToY(min: number): number {
  return Math.max(0, (min - GRID_START_MIN) * HOUR_PX / 60)
}
function durationToPx(startMin: number, endMin: number): number {
  return Math.max(20, (endMin - startMin) * HOUR_PX / 60)
}
function toMins(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

// ── Helpers de fecha ──────────────────────────────────────────
const MONTHS   = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
const DAY_LONG = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]
const DAY_SHORT = ["LUN","MAR","MIÉ","JUE","VIE","SÁB","DOM"]

function getWeekDays(weekOffset: number): Date[] {
  const now = new Date()
  const dow = now.getDay()
  const diffToMon = dow === 0 ? -6 : 1 - dow
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isToday(date: Date) {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth()    === now.getMonth() &&
    date.getDate()     === now.getDate()
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth() &&
    a.getDate()     === b.getDate()
}

// ── Colores por materia (determinista) ───────────────────────
const PALETTE = [
  { bg: "rgba(75,140,248,.18)",  border: "rgba(75,140,248,.35)",  text: "#4b8cf8" },
  { bg: "rgba(139,92,246,.18)",  border: "rgba(139,92,246,.35)",  text: "#8b5cf6" },
  { bg: "rgba(34,197,94,.18)",   border: "rgba(34,197,94,.35)",   text: "#22c55e" },
  { bg: "rgba(245,158,11,.18)",  border: "rgba(245,158,11,.35)",  text: "#f59e0b" },
  { bg: "rgba(239,68,68,.18)",   border: "rgba(239,68,68,.35)",   text: "#ef4444" },
  { bg: "rgba(20,184,166,.18)",  border: "rgba(20,184,166,.35)",  text: "#14b8a6" },
]
function subjectColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff
  return PALETTE[h % PALETTE.length]
}

function taskUrgency(task: Task): "done" | "overdue" | "urgent" | "normal" {
  if (task.status === "DONE") return "done"
  if (!task.dueDate) return "normal"
  const now = Date.now()
  const due = new Date(task.dueDate).getTime()
  if (due < now) return "overdue"
  if (due - now < 7 * 86400000) return "urgent"
  return "normal"
}

// ── Hora labels del grid ──────────────────────────────────────
const HOUR_LABELS = Array.from(
  { length: GRID_END_H - GRID_START_H + 1 },
  (_, i) => `${String(GRID_START_H + i).padStart(2, "0")}:00`
)

// ─────────────────────────────────────────────────────────────

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { week } = await searchParams
  const weekOffset = week ? (parseInt(week, 10) || 0) : 0
  const days = getWeekDays(weekOffset)
  const weekStart = days[0]
  const weekEnd = new Date(days[6]); weekEnd.setHours(23, 59, 59, 999)

  const [tasks, schedule] = await Promise.all([
    db.task.findMany({
      where: {
        userId: session.user.id,
        status: { not: "ARCHIVED" },
        dueDate: { gte: weekStart, lte: weekEnd },
      },
      orderBy: { dueDate: "asc" },
    }),
    db.classSession.findMany({
      where: { userId: session.user.id },
      orderBy: { startTime: "asc" },
    }),
  ])

  // Week label
  const startLabel = `${days[0].getDate()} ${MONTHS[days[0].getMonth()]}`
  const endLabel   = `${days[6].getDate()} ${MONTHS[days[6].getMonth()]}`
  const weekLabel  = weekOffset === 0 ? "Esta semana"
    : weekOffset === -1 ? "Sem. pasada"
    : weekOffset ===  1 ? "Próxima sem."
    : `${startLabel} – ${endLabel}`

  // Stats
  const tasksDone    = tasks.filter((t) => t.status === "DONE").length
  const tasksPending = tasks.filter((t) => t.status !== "DONE").length
  const tasksUrgent  = tasks.filter((t) => taskUrgency(t) === "urgent" || taskUrgency(t) === "overdue").length
  const classesToday = schedule.filter((s) => {
    const todayIdx = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()
    return s.dayOfWeek === todayIdx
  }).length

  // For current-time marker on desktop (Mexico City)
  const nowMX   = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }))
  const nowDay  = (() => { const d = nowMX.getDay(); return d === 0 ? 6 : d - 1 })()
  const nowMins = nowMX.getHours() * 60 + nowMX.getMinutes()

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Navbar ── */}
      <div className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "rgba(10,10,11,.92)", backdropFilter: "blur(12px)", zIndex: 30 }}>
        <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>Calendario</span>
        <div className="flex-1" />
        {/* Stats chips */}
        <div className="hidden sm:flex items-center gap-2">
          {tasksPending > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ fontFamily: "var(--mono)", background: tasksUrgent > 0 ? "var(--red-d)" : "var(--blue-d)", color: tasksUrgent > 0 ? "var(--red)" : "var(--blue)", border: `1px solid ${tasksUrgent > 0 ? "var(--red-b)" : "var(--blue-b)"}` }}>
              {tasksPending} entrega{tasksPending !== 1 ? "s" : ""}
            </span>
          )}
          {tasksDone > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ fontFamily: "var(--mono)", background: "var(--green-d)", color: "var(--green)", border: "1px solid var(--green-b)" }}>
              {tasksDone} lista{tasksDone !== 1 ? "s" : ""}
            </span>
          )}
          {weekOffset === 0 && classesToday > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ fontFamily: "var(--mono)", background: "var(--s3)", color: "var(--tx2)", border: "1px solid var(--b1)" }}>
              {classesToday} clase{classesToday !== 1 ? "s" : ""} hoy
            </span>
          )}
        </div>
        <Suspense fallback={<div className="w-40 h-7 rounded-lg animate-pulse" style={{ background: "var(--s3)" }} />}>
          <WeekNav weekOffset={weekOffset} label={weekLabel} />
        </Suspense>
      </div>

      {/* ── DESKTOP: time-grid calendar ── */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden">

        {/* Sticky day-header row */}
        <div className="shrink-0 grid" style={{
          gridTemplateColumns: "52px repeat(7, minmax(0,1fr))",
          borderBottom: "1px solid var(--b1)",
          background: "var(--bg)",
          zIndex: 20,
        }}>
          {/* Time-label corner */}
          <div style={{ borderRight: "1px solid var(--b1)" }} />

          {days.map((day, i) => {
            const today = isToday(day)
            const dayTasks = tasks.filter((t) => t.dueDate && sameDay(new Date(t.dueDate), day))

            return (
              <div key={i} className="flex flex-col"
                style={{ borderRight: i < 6 ? "1px solid var(--b1)" : undefined }}>
                {/* Day name + number */}
                <div className="flex items-center gap-1.5 px-2 py-2"
                  style={{ background: today ? "var(--blue-d)" : undefined }}>
                  <span className="text-[10px] font-bold tracking-[.08em]"
                    style={{ fontFamily: "var(--mono)", color: today ? "var(--blue)" : "var(--tx2)" }}>
                    {DAY_SHORT[i]}
                  </span>
                  <span className={`text-[${today ? "15" : "13"}px] font-bold`}
                    style={{ color: today ? "var(--blue)" : "var(--tx)", lineHeight: 1 }}>
                    {day.getDate()}
                  </span>
                  {today && (
                    <span className="text-[8px] font-bold px-1 py-px rounded ml-auto"
                      style={{ fontFamily: "var(--mono)", background: "var(--blue)", color: "#fff" }}>HOY</span>
                  )}
                </div>

                {/* Task deadline pills */}
                {dayTasks.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-1.5 pb-1.5 overflow-hidden" style={{ maxHeight: 52 }}>
                    {dayTasks.slice(0, 2).map((t) => {
                      const urg = taskUrgency(t)
                      const bg = urg === "done" ? "var(--green-d)" : urg === "overdue" ? "var(--red-d)" : urg === "urgent" ? "var(--amber-d)" : "var(--s3)"
                      const cl = urg === "done" ? "var(--green)" : urg === "overdue" ? "var(--red)" : urg === "urgent" ? "var(--amber)" : "var(--tx2)"
                      const bd = urg === "done" ? "var(--green-b)" : urg === "overdue" ? "var(--red-b)" : urg === "urgent" ? "var(--amber-b)" : "var(--b1)"
                      return (
                        <Link key={t.id} href="/dashboard/tareas" style={{ textDecoration: "none", display: "block" }}>
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] leading-tight font-medium"
                            style={{ fontFamily: "var(--mono)", background: bg, color: cl, border: `1px solid ${bd}`, maxWidth: "100%", display: "flex" }}>
                            <span className="truncate" style={{ maxWidth: 80 }}>{t.title}</span>
                          </span>
                        </Link>
                      )
                    })}
                    {dayTasks.length > 2 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px]"
                        style={{ fontFamily: "var(--mono)", background: "var(--s3)", color: "var(--tx3)", border: "1px solid var(--b1)" }}>
                        +{dayTasks.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Scrollable time grid */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
          <div className="grid" style={{
            gridTemplateColumns: "52px repeat(7, minmax(0,1fr))",
            height: GRID_HEIGHT + 32, // +32 padding bottom
            position: "relative",
          }}>

            {/* ── Hour labels column ── */}
            <div style={{ position: "relative", borderRight: "1px solid var(--b1)" }}>
              {HOUR_LABELS.map((label, i) => (
                <div key={label} style={{
                  position: "absolute",
                  top: i * HOUR_PX - 8,
                  right: 6,
                  fontSize: 9,
                  fontFamily: "var(--mono)",
                  color: "var(--tx3)",
                  lineHeight: 1,
                  userSelect: "none",
                }}>
                  {label}
                </div>
              ))}
            </div>

            {/* ── Day columns ── */}
            {days.map((day, dayIdx) => {
              const today = isToday(day)
              const daySessions = schedule
                .filter((s) => s.dayOfWeek === dayIdx)
                .sort((a, b) => toMins(a.startTime) - toMins(b.startTime))

              return (
                <div key={dayIdx} style={{
                  position: "relative",
                  borderRight: dayIdx < 6 ? "1px solid var(--b1)" : undefined,
                  height: GRID_HEIGHT + 32,
                  // Hour grid lines via background
                  backgroundImage: `repeating-linear-gradient(to bottom, var(--b1) 0, var(--b1) 1px, transparent 1px, transparent ${HOUR_PX}px)`,
                  backgroundPosition: `0 0`,
                }}>

                  {/* Today highlight column */}
                  {today && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(75,140,248,.03)", pointerEvents: "none" }} />
                  )}

                  {/* ── Class blocks ── */}
                  {daySessions.map((cls, i) => {
                    const startMin = toMins(cls.startTime)
                    const endMin   = toMins(cls.endTime)
                    const top    = minToY(startMin)
                    const height = durationToPx(startMin, endMin)
                    const col    = subjectColor(cls.subjectName)
                    const isActive = weekOffset === 0 && today && cls.dayOfWeek === nowDay &&
                      startMin <= nowMins && endMin > nowMins

                    return (
                      <div key={i} style={{
                        position: "absolute",
                        top: top + 1,
                        left: 2,
                        right: 2,
                        height: height - 2,
                        background: isActive ? "rgba(34,197,94,.2)" : col.bg,
                        border: `1px solid ${isActive ? "rgba(34,197,94,.5)" : col.border}`,
                        borderRadius: 6,
                        padding: "3px 6px",
                        overflow: "hidden",
                        zIndex: 5,
                        cursor: "default",
                      }}>
                        {isActive && (
                          <div style={{
                            position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
                            background: "var(--green)", borderRadius: "6px 0 0 6px",
                          }} />
                        )}
                        <p style={{
                          fontSize: 10, fontWeight: 600, lineHeight: 1.3, margin: 0,
                          color: isActive ? "var(--green)" : col.text,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          paddingLeft: isActive ? 6 : 0,
                        }}>
                          {cls.subjectName}
                        </p>
                        {height >= 36 && (
                          <p style={{
                            fontSize: 9, lineHeight: 1.2, margin: 0, marginTop: 1,
                            fontFamily: "var(--mono)", color: isActive ? "var(--green)" : col.text, opacity: 0.75,
                            paddingLeft: isActive ? 6 : 0,
                          }}>
                            {cls.startTime}–{cls.endTime}
                            {cls.room && height >= 52 ? ` · ${cls.room}` : ""}
                          </p>
                        )}
                      </div>
                    )
                  })}

                  {/* ── Current time line (client, live) ── */}
                  {today && weekOffset === 0 && <CurrentTimeLine />}

                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── MOBILE: vertical day list ── */}
      <div className="md:hidden flex-1 overflow-y-auto">

        {/* Mini week strip */}
        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: "1px solid var(--b1)", scrollbarWidth: "none" }}>
          {days.map((day, i) => {
            const today   = isToday(day)
            const hasTasks = tasks.some((t) => t.dueDate && sameDay(new Date(t.dueDate), day))
            const hasClass = schedule.some((s) => s.dayOfWeek === i)
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 shrink-0" style={{ minWidth: 36 }}>
                <span className="text-[9px]" style={{ fontFamily: "var(--mono)", color: today ? "var(--blue)" : "var(--tx3)" }}>
                  {DAY_SHORT[i]}
                </span>
                <div className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: today ? "var(--blue)" : "transparent", border: today ? "none" : "1px solid var(--b1)" }}>
                  <span className="text-[11px] font-bold" style={{ color: today ? "#fff" : "var(--tx2)" }}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {hasTasks && <div className="w-1 h-1 rounded-full" style={{ background: "var(--amber)" }} />}
                  {hasClass && <div className="w-1 h-1 rounded-full" style={{ background: "var(--blue)" }} />}
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-3 space-y-3">
          {days.map((day, dayIdx) => {
            const today      = isToday(day)
            const daySessions = schedule
              .filter((s: ClassSession) => s.dayOfWeek === dayIdx)
              .sort((a, b) => toMins(a.startTime) - toMins(b.startTime))
            const dayTasks = tasks.filter((t: Task) => t.dueDate && sameDay(new Date(t.dueDate), day))

            const isPast = day.getTime() < new Date().setHours(0, 0, 0, 0)
            if (isPast && !today && daySessions.length === 0 && dayTasks.length === 0) return null

            // Merge and sort sessions + tasks by time
            const events: ({ type: "class"; data: ClassSession } | { type: "task"; data: Task })[] = [
              ...daySessions.map((s) => ({ type: "class" as const, data: s })),
              ...dayTasks.map((t) => ({ type: "task" as const, data: t })),
            ].sort((a, b) => {
              const timeA = a.type === "class" ? toMins(a.data.startTime) : (a.data.dueDate ? new Date(a.data.dueDate).getHours() * 60 + new Date(a.data.dueDate).getMinutes() : 0)
              const timeB = b.type === "class" ? toMins(b.data.startTime) : (b.data.dueDate ? new Date(b.data.dueDate).getHours() * 60 + new Date(b.data.dueDate).getMinutes() : 0)
              return timeA - timeB
            })

            return (
              <div key={dayIdx} className="rounded-2xl overflow-hidden"
                style={{ background: "var(--card)", border: `1px solid ${today ? "var(--blue-b)" : "var(--b1)"}` }}>

                {/* Day header */}
                <div className="flex items-center gap-2.5 px-4 py-2.5"
                  style={{ background: today ? "var(--blue-d)" : "var(--s2)", borderBottom: "1px solid var(--b1)" }}>
                  <div>
                    <p className="text-[13px] font-bold leading-tight"
                      style={{ color: today ? "var(--blue)" : "var(--tx)" }}>
                      {DAY_LONG[dayIdx]}
                    </p>
                    <p className="text-[10px]" style={{ fontFamily: "var(--mono)", color: today ? "var(--blue)" : "var(--tx3)" }}>
                      {day.getDate()} {MONTHS[day.getMonth()]}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5">
                    {daySessions.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ fontFamily: "var(--mono)", background: "var(--blue-d)", color: "var(--blue)", border: "1px solid var(--blue-b)" }}>
                        {daySessions.length} clase{daySessions.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ fontFamily: "var(--mono)", background: "var(--amber-d)", color: "var(--amber)", border: "1px solid var(--amber-b)" }}>
                        {dayTasks.length} entrega{dayTasks.length !== 1 ? "s" : ""}
                      </span>
                    )}
                    {today && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded font-bold"
                        style={{ fontFamily: "var(--mono)", background: "var(--blue)", color: "#fff" }}>HOY</span>
                    )}
                  </div>
                </div>

                {/* Events */}
                <div className="divide-y" style={{ borderColor: "var(--b1)" }}>
                  {events.map((event, ei) => {
                    if (event.type === "class") {
                      const cls = event.data
                      const col = subjectColor(cls.subjectName)
                      const isActive = weekOffset === 0 && today && cls.dayOfWeek === nowDay &&
                        toMins(cls.startTime) <= nowMins && toMins(cls.endTime) > nowMins
                      return (
                        <div key={`c${ei}`} className="flex items-stretch gap-0 px-3 py-2.5">
                          <div className="w-1 rounded-full shrink-0 mr-3 my-0.5"
                            style={{ background: isActive ? "var(--green)" : col.border }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold leading-snug"
                              style={{ color: isActive ? "var(--green)" : "var(--tx)" }}>
                              {cls.subjectName}
                            </p>
                            <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                              {cls.startTime}–{cls.endTime}
                              {cls.room ? ` · Aula ${cls.room}` : ""}
                              {cls.professor ? ` · ${cls.professor}` : ""}
                            </p>
                          </div>
                          {isActive && (
                            <div className="shrink-0 flex items-center">
                              <div className="w-1.5 h-1.5 rounded-full"
                                style={{ background: "var(--green)", boxShadow: "0 0 5px var(--green)" }} />
                            </div>
                          )}
                        </div>
                      )
                    } else {
                      const task = event.data
                      const urg = taskUrgency(task)
                      const color = urg === "done" ? "var(--green)" : urg === "overdue" ? "var(--red)" : urg === "urgent" ? "var(--amber)" : "var(--blue)"
                      const label = urg === "done" ? "Entregada" : urg === "overdue" ? "Vencida" : urg === "urgent" ? "Urgente" : "Entrega"
                      return (
                        <Link key={`t${ei}`} href="/dashboard/tareas" style={{ textDecoration: "none", display: "block" }}>
                          <div className="flex items-stretch gap-0 px-3 py-2.5 transition-colors"
                            style={{ background: urg === "overdue" ? "rgba(239,68,68,.04)" : undefined }}>
                            <div className="w-1 rounded-full shrink-0 mr-3 my-0.5" style={{ background: color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium leading-snug"
                                style={{ color: "var(--tx)", textDecoration: urg === "done" ? "line-through" : "none", opacity: urg === "done" ? 0.5 : 1 }}>
                                {task.title}
                              </p>
                              {task.courseName && (
                                <p className="text-[10px] mt-0.5 truncate" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                                  {task.courseName}
                                </p>
                              )}
                            </div>
                            <span className="text-[9px] shrink-0 ml-2 self-start mt-0.5 px-1.5 py-0.5 rounded font-medium"
                              style={{ fontFamily: "var(--mono)", background: urg === "done" ? "var(--green-d)" : urg === "overdue" ? "var(--red-d)" : urg === "urgent" ? "var(--amber-d)" : "var(--blue-d)", color, border: `1px solid ${urg === "done" ? "var(--green-b)" : urg === "overdue" ? "var(--red-b)" : urg === "urgent" ? "var(--amber-b)" : "var(--blue-b)"}` }}>
                              {label}
                            </span>
                          </div>
                        </Link>
                      )
                    }
                  })}

                  {events.length === 0 && (
                    <p className="text-center text-[10px] py-3" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                      Día libre
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && schedule.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
          <div className="rounded-2xl p-8 text-center pointer-events-auto"
            style={{ background: "var(--card)", border: "1px solid var(--b1)", maxWidth: 320 }}>
            <p className="text-[14px] font-semibold mb-1.5" style={{ color: "var(--tx)" }}>Sin eventos esta semana</p>
            <p className="text-[11px] mb-5" style={{ fontFamily: "var(--mono)", color: "var(--tx2)", lineHeight: 1.6 }}>
              Sincroniza Moodle para tareas y Mindbox para tu horario de clases.
            </p>
            <div className="flex items-center justify-center gap-2">
              <a href="/dashboard/tareas" className="inline-flex h-8 px-3 items-center rounded-lg text-xs font-semibold"
                style={{ background: "var(--blue-d)", border: "1px solid var(--blue-b)", color: "var(--blue)", textDecoration: "none" }}>
                Sincronizar tareas
              </a>
              <a href="/dashboard/settings" className="inline-flex h-8 px-3 items-center rounded-lg text-xs font-semibold"
                style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", textDecoration: "none" }}>
                Configurar Mindbox
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
