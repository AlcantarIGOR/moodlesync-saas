import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.id !== process.env.ADMIN_USER_ID) redirect("/dashboard")

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      moodleUsername: true,
      email: true,
      mindboxPassword: true,
      plan: true,
      createdAt: true,
      lastSeenAt: true,
      _count: {
        select: {
          tasks: true,
          grades: true,
          schedule: true,
          pushSubs: true,
        },
      },
    },
  })

  const now = new Date()
  const DAY = 1000 * 60 * 60 * 24

  function relativeTime(date: Date | null): string {
    if (!date) return "—"
    const diff = now.getTime() - date.getTime()
    if (diff < 60_000) return "ahora"
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
    if (diff < DAY) return `${Math.floor(diff / 3_600_000)}h`
    if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`
    return date.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
  }

  const totalUsers = users.length
  const activeToday = users.filter((u) => u.lastSeenAt && now.getTime() - u.lastSeenAt.getTime() < DAY).length
  const activeWeek  = users.filter((u) => u.lastSeenAt && now.getTime() - u.lastSeenAt.getTime() < 7 * DAY).length
  const withMindbox = users.filter((u) => !!u.mindboxPassword).length
  const withEmail   = users.filter((u) => !!u.email).length
  const withPush    = users.filter((u) => u._count.pushSubs > 0).length

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center justify-between px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "var(--bg-glass)", backdropFilter: "blur(10px)" }}>
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>Admin</span>
          <span className="text-[11px] px-2 py-0.5 rounded"
            style={{ fontFamily: "var(--mono)", background: "var(--red-d)", color: "var(--red)", border: "1px solid var(--red-b)" }}>
            INTERNO
          </span>
        </div>
        <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
          {totalUsers} usuario{totalUsers !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total",         value: totalUsers,  color: "var(--tx)"   },
              { label: "Hoy activos",   value: activeToday, color: "var(--green)" },
              { label: "Esta semana",   value: activeWeek,  color: "var(--blue)"  },
              { label: "Con Mindbox",   value: withMindbox, color: "var(--amber)" },
              { label: "Notif. email",  value: withEmail,   color: "var(--tx2)"  },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
              <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Usuarios registrados
              </p>
              <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                push: {withPush}
              </span>
            </div>

            {/* Table header */}
            <div className="hidden md:grid px-4 py-2 text-[10px] uppercase tracking-[.07em]"
              style={{
                gridTemplateColumns: "1fr 100px 60px 60px 60px 55px 70px 70px",
                fontFamily: "var(--mono)", color: "var(--tx3)",
                borderBottom: "1px solid var(--b1)", background: "var(--s2)"
              }}>
              <span>Nombre</span>
              <span>N° Control</span>
              <span className="text-center">Tareas</span>
              <span className="text-center">Califs</span>
              <span className="text-center">Clases</span>
              <span className="text-center">Mindbox</span>
              <span className="text-right">Registro</span>
              <span className="text-right">Visto</span>
            </div>

            <div className="divide-y" style={{ borderColor: "var(--b1)" }}>
              {users.map((u) => {
                const seenRecently = u.lastSeenAt && now.getTime() - u.lastSeenAt.getTime() < DAY
                return (
                  <div key={u.id}
                    className="hidden md:grid px-4 py-3 items-center text-[12px]"
                    style={{ gridTemplateColumns: "1fr 100px 60px 60px 60px 55px 70px 70px" }}>

                    {/* Name */}
                    <div className="min-w-0 pr-3">
                      <p className="font-medium truncate" style={{ color: "var(--tx)" }}>{u.name}</p>
                      {u.email && (
                        <p className="text-[10px] truncate" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>{u.email}</p>
                      )}
                    </div>

                    {/* ncontrol */}
                    <span style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>{u.moodleUsername}</span>

                    {/* Tasks */}
                    <span className="text-center" style={{ color: u._count.tasks > 0 ? "var(--tx)" : "var(--tx3)" }}>
                      {u._count.tasks}
                    </span>

                    {/* Grades */}
                    <span className="text-center" style={{ color: u._count.grades > 0 ? "var(--tx)" : "var(--tx3)" }}>
                      {u._count.grades}
                    </span>

                    {/* Schedule */}
                    <span className="text-center" style={{ color: u._count.schedule > 0 ? "var(--tx)" : "var(--tx3)" }}>
                      {u._count.schedule}
                    </span>

                    {/* Mindbox */}
                    <span className="text-center">
                      <span className="text-[9px] rounded px-1.5 py-0.5 font-semibold"
                        style={{
                          fontFamily: "var(--mono)",
                          background: u.mindboxPassword ? "var(--green-d)" : "var(--s3)",
                          color: u.mindboxPassword ? "var(--green)" : "var(--tx3)",
                          border: `1px solid ${u.mindboxPassword ? "var(--green-b)" : "var(--b1)"}`,
                        }}>
                        {u.mindboxPassword ? "SÍ" : "NO"}
                      </span>
                    </span>

                    {/* Registered */}
                    <span className="text-right" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                      {relativeTime(u.createdAt)}
                    </span>

                    {/* Last seen */}
                    <span className="text-right font-semibold"
                      style={{ fontFamily: "var(--mono)", color: seenRecently ? "var(--green)" : "var(--tx3)" }}>
                      {relativeTime(u.lastSeenAt)}
                    </span>
                  </div>
                )
              })}

              {/* Mobile cards */}
              {users.map((u) => {
                const seenRecently = u.lastSeenAt && now.getTime() - u.lastSeenAt.getTime() < DAY
                return (
                  <div key={u.id + "-mobile"} className="md:hidden px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: "var(--tx)" }}>{u.name}</p>
                        <p className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>{u.moodleUsername}</p>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ fontFamily: "var(--mono)", color: seenRecently ? "var(--green)" : "var(--tx3)" }}>
                        {relativeTime(u.lastSeenAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Chip label={`${u._count.tasks} tareas`} />
                      <Chip label={`${u._count.grades} califs`} />
                      <Chip label={`${u._count.schedule} clases`} />
                      {u.mindboxPassword && <Chip label="Mindbox" color="green" />}
                      {u.email && <Chip label="Email" color="blue" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function Chip({ label, color }: { label: string; color?: "green" | "blue" }) {
  const styles = {
    green: { bg: "var(--green-d)", border: "var(--green-b)", text: "var(--green)" },
    blue:  { bg: "var(--blue-d)",  border: "var(--blue-b)",  text: "var(--blue)"  },
    default: { bg: "var(--s3)", border: "var(--b1)", text: "var(--tx2)" },
  }[color ?? "default"]

  return (
    <span className="text-[10px] rounded px-1.5 py-0.5"
      style={{ fontFamily: "var(--mono)", background: styles.bg, color: styles.text, border: `1px solid ${styles.border}` }}>
      {label}
    </span>
  )
}
