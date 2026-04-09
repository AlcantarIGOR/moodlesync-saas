import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import type { Task, ClassSession } from "@prisma/client"
import { WeekNav } from "@/components/dashboard/week-nav"
import Link from "next/link"
import { Suspense } from "react"

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const DAY_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

function getWeekDays(weekOffset: number): Date[] {
  const now = new Date()
  const dow = now.getDay()                      // 0=Sun … 6=Sat
  const diffToMon = dow === 0 ? -6 : 1 - dow   // days until Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMon + weekOffset * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toMins(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + (m ?? 0) }

function isToday(date: Date) {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
}

function isOverdue(task: Task) {
  return task.dueDate && new Date(task.dueDate).getTime() < Date.now()
}
function isUrgent(task: Task) {
  if (!task.dueDate) return false
  const t = new Date(task.dueDate).getTime()
  return t >= Date.now() && t < Date.now() + 3 * 86400000
}

const COURSE_COLORS = [
  { bg: "var(--blue-d)",   border: "var(--blue-b)",   text: "var(--blue)"  },
  { bg: "var(--green-d)",  border: "var(--green-b)",  text: "var(--green)" },
  { bg: "var(--amber-d)",  border: "var(--amber-b)",  text: "var(--amber)" },
  { bg: "var(--red-d)",    border: "var(--red-b)",    text: "var(--red)"   },
  { bg: "var(--s3)",       border: "var(--b2)",       text: "var(--tx)"    },
]
function courseColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff
  return COURSE_COLORS[h % COURSE_COLORS.length]
}

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
  const weekEnd = new Date(days[6])
  weekEnd.setHours(23, 59, 59, 999)

  // Fetch tasks due this week
  const tasks = await db.task.findMany({
    where: {
      userId: session.user.id,
      status: { not: "ARCHIVED" },
      dueDate: { gte: weekStart, lte: weekEnd },
    },
    orderBy: { dueDate: "asc" },
  })

  // Fetch all class sessions (they repeat weekly)
  const schedule = await db.classSession.findMany({
    where: { userId: session.user.id },
    orderBy: { startTime: "asc" },
  })

  // Week label
  const startLabel = `${days[0].getDate()} ${MONTHS[days[0].getMonth()]}`
  const endLabel   = `${days[6].getDate()} ${MONTHS[days[6].getMonth()]}`
  const weekLabel  = weekOffset === 0 ? "Esta semana"
    : weekOffset === -1 ? "Semana pasada"
    : weekOffset === 1  ? "Próxima semana"
    : `${startLabel} – ${endLabel}`

  // Now for current class detection (only relevant when weekOffset === 0)
  const nowDay  = (() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })()
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes()

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "rgba(10,10,11,.85)", backdropFilter: "blur(10px)" }}>
        <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>Calendario</span>
        <div className="flex-1" />
        <Suspense fallback={<div className="w-40 h-7 rounded-lg animate-pulse" style={{ background: "var(--s3)" }} />}>
          <WeekNav weekOffset={weekOffset} label={weekLabel} />
        </Suspense>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5">

        {/* ── DESKTOP: 7-column grid ── */}
        <div className="hidden md:grid gap-2" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
          {days.map((day, dayIdx) => {
            const today = isToday(day)
            // dayIdx 0=Mon…6=Sun → matches ClassSession.dayOfWeek
            const daySessions = schedule
              .filter((s) => s.dayOfWeek === dayIdx)
              .sort((a, b) => toMins(a.startTime) - toMins(b.startTime))
            const dayTasks = tasks.filter((t) => {
              if (!t.dueDate) return false
              const d = new Date(t.dueDate)
              return d.getFullYear() === day.getFullYear() &&
                d.getMonth() === day.getMonth() &&
                d.getDate() === day.getDate()
            })

            return (
              <div key={dayIdx} className="rounded-xl overflow-hidden flex flex-col"
                style={{ background: "var(--card)", border: `1px solid ${today ? "var(--blue-b)" : "var(--b1)"}`, minHeight: 160 }}>
                {/* Day header */}
                <div className="px-2.5 py-2 flex items-center gap-1.5"
                  style={{ background: today ? "var(--blue-d)" : "var(--s2)", borderBottom: `1px solid ${today ? "var(--blue-b)" : "var(--b1)"}` }}>
                  <span className="text-[10px] font-bold"
                    style={{ fontFamily: "var(--mono)", color: today ? "var(--blue)" : "var(--tx2)" }}>
                    {DAY_SHORT[dayIdx]}
                  </span>
                  <span className="text-[10px] font-semibold" style={{ fontFamily: "var(--mono)", color: today ? "var(--blue)" : "var(--tx3)" }}>
                    {day.getDate()}
                  </span>
                  {today && (
                    <span className="text-[8px] rounded px-1 py-px font-bold ml-auto"
                      style={{ background: "var(--blue)", color: "#fff", fontFamily: "var(--mono)" }}>
                      HOY
                    </span>
                  )}
                </div>

                {/* Events */}
                <div className="flex-1 p-1.5 space-y-1 overflow-hidden">
                  {/* Classes */}
                  {daySessions.map((cls, i) => {
                    const c = courseColor(cls.subjectName)
                    const isActive = weekOffset === 0 && cls.dayOfWeek === nowDay &&
                      toMins(cls.startTime) <= nowMins && toMins(cls.endTime) > nowMins
                    return (
                      <div key={i} className="rounded px-1.5 py-1 text-[10px] leading-tight"
                        style={{ background: isActive ? "var(--green-d)" : c.bg, border: `1px solid ${isActive ? "var(--green-b)" : c.border}` }}>
                        <p className="font-medium truncate" style={{ color: isActive ? "var(--green)" : c.text }}>
                          {cls.subjectName}
                        </p>
                        <p style={{ color: "var(--tx2)", fontFamily: "var(--mono)" }}>
                          {cls.startTime}–{cls.endTime}
                        </p>
                      </div>
                    )
                  })}
                  {/* Task deadlines */}
                  {dayTasks.map((task) => {
                    const overdue = isOverdue(task)
                    const urgent  = isUrgent(task)
                    const dotColor = task.status === "DONE" ? "var(--green)"
                      : overdue ? "var(--red)" : urgent ? "var(--amber)" : "var(--tx2)"
                    return (
                      <Link key={task.id} href="/dashboard/tareas" style={{ textDecoration: "none" }}>
                        <div className="rounded px-1.5 py-1 text-[10px] leading-tight flex items-start gap-1"
                          style={{ background: overdue ? "var(--red-d)" : urgent ? "var(--amber-d)" : "var(--s3)",
                            border: `1px solid ${overdue ? "var(--red-b)" : urgent ? "var(--amber-b)" : "var(--b2)"}` }}>
                          <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-[2px]" style={{ background: dotColor }} />
                          <p className="truncate font-medium" style={{ color: "var(--tx)" }}>{task.title}</p>
                        </div>
                      </Link>
                    )
                  })}
                  {daySessions.length === 0 && dayTasks.length === 0 && (
                    <p className="text-[9px] pt-1 text-center" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>—</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── MOBILE: vertical list ── */}
        <div className="md:hidden space-y-3">
          {days.map((day, dayIdx) => {
            const today = isToday(day)
            const daySessions = schedule
              .filter((s: ClassSession) => s.dayOfWeek === dayIdx)
              .sort((a, b) => toMins(a.startTime) - toMins(b.startTime))
            const dayTasks = tasks.filter((t: Task) => {
              if (!t.dueDate) return false
              const d = new Date(t.dueDate)
              return d.getFullYear() === day.getFullYear() &&
                d.getMonth() === day.getMonth() &&
                d.getDate() === day.getDate()
            })
            // Always show today; skip past days with no events to keep the list clean
            const isPast = day.getTime() < new Date().setHours(0, 0, 0, 0)
            if (isPast && !today && daySessions.length === 0 && dayTasks.length === 0) return null

            return (
              <div key={dayIdx} className="rounded-2xl overflow-hidden"
                style={{ background: "var(--card)", border: `1px solid ${today ? "var(--blue-b)" : "var(--b1)"}` }}>
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-2.5"
                  style={{ background: today ? "var(--blue-d)" : "var(--s2)", borderBottom: `1px solid ${today ? "var(--blue-b)" : "var(--b1)"}` }}>
                  <span className="text-[11px] font-bold"
                    style={{ fontFamily: "var(--mono)", color: today ? "var(--blue)" : "var(--tx2)" }}>
                    {DAY_SHORT[dayIdx]}
                  </span>
                  <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: today ? "var(--blue)" : "var(--tx3)" }}>
                    {day.getDate()} {MONTHS[day.getMonth()]}
                  </span>
                  {today && (
                    <span className="text-[9px] rounded px-1.5 py-px font-bold ml-auto"
                      style={{ background: "var(--blue)", color: "#fff", fontFamily: "var(--mono)" }}>
                      HOY
                    </span>
                  )}
                </div>

                <div className="divide-y" style={{ borderColor: "var(--b1)" }}>
                  {/* Classes */}
                  {daySessions.map((cls, i) => {
                    const c = courseColor(cls.subjectName)
                    const isActive = weekOffset === 0 && cls.dayOfWeek === nowDay &&
                      toMins(cls.startTime) <= nowMins && toMins(cls.endTime) > nowMins
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: isActive ? "var(--green)" : c.border }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium truncate" style={{ color: isActive ? "var(--green)" : "var(--tx)" }}>
                            {cls.subjectName}
                          </p>
                          <p className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                            {cls.startTime}–{cls.endTime}{cls.room ? ` · Aula ${cls.room}` : ""}
                          </p>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: "var(--green)", boxShadow: "0 0 4px var(--green)" }} />
                        )}
                      </div>
                    )
                  })}
                  {/* Tasks */}
                  {dayTasks.map((task) => {
                    const overdue = isOverdue(task)
                    const urgent  = isUrgent(task)
                    const accentColor = task.status === "DONE" ? "var(--green)"
                      : overdue ? "var(--red)" : urgent ? "var(--amber)" : "var(--blue)"
                    return (
                      <Link key={task.id} href="/dashboard/tareas" style={{ textDecoration: "none" }}>
                        <div className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accentColor }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium truncate" style={{ color: "var(--tx)" }}>{task.title}</p>
                            {task.courseName && (
                              <p className="text-[10px] truncate" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>{task.courseName}</p>
                            )}
                          </div>
                          <span className="text-[10px] shrink-0" style={{ fontFamily: "var(--mono)", color: accentColor }}>
                            {task.status === "DONE" ? "✓" : overdue ? "Vencida" : urgent ? "Urgente" : "Entrega"}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Empty state — no tasks this week AND no classes configured */}
        {tasks.length === 0 && schedule.length === 0 && (
          <div className="rounded-2xl p-6 text-center mt-2" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--tx)" }}>Sin eventos esta semana</p>
            <p className="text-[11px] mb-4" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Sincroniza Moodle para ver tareas y Mindbox para ver tu horario de clases.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a href="/dashboard/tareas" className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-semibold"
                style={{ background: "var(--blue-d)", border: "1px solid var(--blue-b)", color: "var(--blue)", textDecoration: "none" }}>
                Ir a Tareas
              </a>
              <a href="/dashboard/settings" className="inline-flex items-center h-8 px-3 rounded-lg text-xs font-semibold"
                style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", textDecoration: "none" }}>
                Configurar Mindbox
              </a>
            </div>
          </div>
        )}
        {/* Partial empty: has classes but no tasks this week */}
        {tasks.length === 0 && schedule.length > 0 && (
          <p className="text-center text-[11px] mt-3" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
            Sin entregas esta semana
          </p>
        )}
      </div>
    </div>
  )
}
