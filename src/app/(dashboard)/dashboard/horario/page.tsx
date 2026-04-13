import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import type { ClassSession } from "@prisma/client"
import { MindboxSyncButton } from "@/components/dashboard/mindbox-sync-button"

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
const DAY_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

// Unique pastel-ish colors per subject
const SUBJECT_COLORS = [
  { bg: "var(--blue-d)",   border: "var(--blue-b)",   text: "var(--blue)"  },
  { bg: "var(--green-d)",  border: "var(--green-b)",  text: "var(--green)" },
  { bg: "var(--amber-d)",  border: "var(--amber-b)",  text: "var(--amber)" },
  { bg: "var(--red-d)",    border: "var(--red-b)",    text: "var(--red)"   },
  { bg: "var(--s3)",       border: "var(--b2)",       text: "var(--tx)"    },
  { bg: "var(--blue-d)",   border: "var(--blue-b)",   text: "var(--blue)"  },
  { bg: "var(--green-d)",  border: "var(--green-b)",  text: "var(--green)" },
  { bg: "var(--amber-d)",  border: "var(--amber-b)",  text: "var(--amber)" },
]

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + (m ?? 0)
}

function buildColorMap(sessions: ClassSession[]): Map<string, (typeof SUBJECT_COLORS)[number]> {
  const map = new Map<string, (typeof SUBJECT_COLORS)[number]>()
  let i = 0
  for (const s of sessions) {
    if (!map.has(s.subjectName)) {
      map.set(s.subjectName, SUBJECT_COLORS[i % SUBJECT_COLORS.length])
      i++
    }
  }
  return map
}

function getNowMX(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }))
}

function getCurrentDayMX(): number {
  // JS getDay(): 0=Sun,1=Mon...6=Sat → convert to 0=Mon...6=Sun
  const d = getNowMX().getDay()
  return d === 0 ? 6 : d - 1
}

function getCurrentTimeMinutes(): number {
  const now = getNowMX()
  return now.getHours() * 60 + now.getMinutes()
}

function getActiveClass(sessions: ClassSession[]): ClassSession | null {
  const day = getCurrentDayMX()
  const mins = getCurrentTimeMinutes()
  return sessions.find(
    (s) => s.dayOfWeek === day && toMinutes(s.startTime) <= mins && toMinutes(s.endTime) > mins
  ) ?? null
}

function getNextClass(sessions: ClassSession[]): { session: ClassSession; minutesUntil: number } | null {
  const day = getCurrentDayMX()
  const mins = getCurrentTimeMinutes()

  // Check rest of today
  const todayUpcoming = sessions
    .filter((s) => s.dayOfWeek === day && toMinutes(s.startTime) > mins)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))

  if (todayUpcoming.length) {
    return { session: todayUpcoming[0], minutesUntil: toMinutes(todayUpcoming[0].startTime) - mins }
  }

  // Check next days this week
  for (let offset = 1; offset <= 6; offset++) {
    const nextDay = (day + offset) % 7
    const nextSessions = sessions
      .filter((s) => s.dayOfWeek === nextDay)
      .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
    if (nextSessions.length) {
      return { session: nextSessions[0], minutesUntil: offset * 24 * 60 + toMinutes(nextSessions[0].startTime) - mins }
    }
  }
  return null
}

export default async function HorarioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mindboxPassword: true },
  })

  const sessions = await db.classSession.findMany({
    where: { userId: session.user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  })

  const hasMindbox = !!user?.mindboxPassword
  const colorMap = buildColorMap(sessions)
  const activeClass = getActiveClass(sessions)
  const nextClass = getNextClass(sessions)
  const today = getCurrentDayMX()

  // Group by day
  const byDay = new Map<number, ClassSession[]>()
  for (const s of sessions) {
    if (!byDay.has(s.dayOfWeek)) byDay.set(s.dayOfWeek, [])
    byDay.get(s.dayOfWeek)!.push(s)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center justify-between px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "rgba(10,10,11,.85)", backdropFilter: "blur(10px)" }}>
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>Horario</span>
          <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>— semestre actual</span>
        </div>
        <MindboxSyncButton hasCredentials={hasMindbox} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Active / Next class banner */}
          {sessions.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
              {activeClass ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--green)", boxShadow: "0 0 6px var(--green)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-[.08em] mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--green)" }}>Ahora en clase</p>
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tx)" }}>{activeClass.subjectName}</p>
                    <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                      {activeClass.startTime}–{activeClass.endTime} · Aula {activeClass.room ?? "—"}
                    </p>
                  </div>
                </div>
              ) : nextClass ? (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--amber)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] uppercase tracking-[.08em] mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--amber)" }}>
                      Próxima clase · en {nextClass.minutesUntil < 60
                        ? `${nextClass.minutesUntil} min`
                        : nextClass.minutesUntil < 1440
                        ? `${Math.round(nextClass.minutesUntil / 60)}h`
                        : `${Math.round(nextClass.minutesUntil / 1440)}d`}
                    </p>
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tx)" }}>{nextClass.session.subjectName}</p>
                    <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                      {DAY_NAMES[nextClass.session.dayOfWeek]} {nextClass.session.startTime}–{nextClass.session.endTime} · Aula {nextClass.session.room ?? "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-[12px] text-center" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Sin clases restantes esta semana</p>
              )}
            </div>
          )}

          {!hasMindbox ? (
            <div className="rounded-2xl p-6 text-center" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--tx)" }}>Mindbox no configurado</p>
              <p className="text-[12px] mb-4" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Agrega tu contraseña en Configuración para ver tu horario.
              </p>
              <a href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold"
                style={{ background: "var(--blue)", color: "#fff", textDecoration: "none" }}>
                Ir a Configuración
              </a>
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
              <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--tx)" }}>Sin horario</p>
              <p className="text-[11px] mb-4" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Sincroniza Mindbox para cargar tu horario.
              </p>
            </div>
          ) : (
            /* Day columns */
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((dayIdx) => {
                const daySessions = (byDay.get(dayIdx) ?? []).sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))
                const isToday = dayIdx === today
                return (
                  <div key={dayIdx} className="rounded-2xl overflow-hidden"
                    style={{ background: "var(--card)", border: `1px solid ${isToday ? "var(--blue-b)" : "var(--b1)"}` }}>
                    <div className="flex items-center gap-2 px-4 py-2.5"
                      style={{ background: isToday ? "var(--blue-d)" : "var(--s2)", borderBottom: `1px solid ${isToday ? "var(--blue-b)" : "var(--b1)"}` }}>
                      <span className="text-[11px] font-bold tracking-[.06em]"
                        style={{ fontFamily: "var(--mono)", color: isToday ? "var(--blue)" : "var(--tx2)" }}>
                        {DAY_SHORT[dayIdx]}
                      </span>
                      {isToday && (
                        <span className="text-[9px] rounded px-1.5 py-0.5 font-semibold"
                          style={{ fontFamily: "var(--mono)", background: "var(--blue)", color: "#fff" }}>
                          HOY
                        </span>
                      )}
                      <span className="ml-auto text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                        {daySessions.length} {daySessions.length === 1 ? "clase" : "clases"}
                      </span>
                    </div>

                    {daySessions.length === 0 ? (
                      <p className="px-4 py-3 text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>Día libre</p>
                    ) : (
                      <div className="divide-y" style={{ borderColor: "var(--b1)" }}>
                        {daySessions.map((cls, i) => {
                          const color = colorMap.get(cls.subjectName)!
                          const isActive = activeClass?.id === cls.id
                          return (
                            <div key={i} className="flex items-start gap-3 px-4 py-3"
                              style={{ background: isActive ? "rgba(34,197,94,0.08)" : undefined }}>
                              <div className="flex flex-col items-center shrink-0 pt-0.5" style={{ minWidth: 52 }}>
                                <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--mono)", color: "var(--tx)" }}>
                                  {cls.startTime}
                                </span>
                                <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                                  {cls.endTime}
                                </span>
                              </div>
                              <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ background: color.border }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium leading-snug" style={{ color: "var(--tx)" }}>
                                  {cls.subjectName}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {cls.room && (
                                    <span className="text-[10px] rounded px-1.5 py-0.5"
                                      style={{ fontFamily: "var(--mono)", color: color.text, background: color.bg, border: `1px solid ${color.border}` }}>
                                      Aula {cls.room}
                                    </span>
                                  )}
                                  {cls.professor && (
                                    <span className="text-[10px] truncate" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                                      {cls.professor}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isActive && (
                                <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "var(--green)", boxShadow: "0 0 4px var(--green)" }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
