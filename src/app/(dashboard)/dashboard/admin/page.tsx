import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AdminUserTable } from "@/components/dashboard/admin-user-table"

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.id !== process.env.ADMIN_USER_ID) redirect("/dashboard")

  const dbUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      moodleUsername: true,
      email: true,
      mindboxPassword: true,
      createdAt: true,
      lastSeenAt: true,
      _count: {
        select: {
          tasks: true,
          grades: true,
          schedule: true,
          pushSubs: true,
          notes: true,
        },
      },
    },
  })

  const now = new Date()
  const DAY = 1000 * 60 * 60 * 24


  type Status = "nuevo" | "activo" | "inactivo" | "dormido"
  function userStatus(u: { createdAt: Date; lastSeenAt: Date | null }): Status {
    const age  = now.getTime() - u.createdAt.getTime()
    const seen = u.lastSeenAt ? now.getTime() - u.lastSeenAt.getTime() : Infinity
    if (age  <  7 * DAY) return "nuevo"
    if (seen <  3 * DAY) return "activo"
    if (seen < 30 * DAY) return "inactivo"
    return "dormido"
  }

  const users = dbUsers.map((u) => ({
    id: u.id,
    name: u.name,
    moodleUsername: u.moodleUsername,
    email: u.email,
    hasMindbox: !!u.mindboxPassword,
    createdAt: u.createdAt,
    lastSeenAt: u.lastSeenAt,
    status: userStatus(u),
    noSync: u._count.tasks === 0 && u._count.grades === 0 && u._count.schedule === 0,
    _count: u._count,
  }))

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalUsers  = users.length
  const activeToday = users.filter((u) => u.lastSeenAt && now.getTime() - u.lastSeenAt.getTime() < DAY).length
  const activeWeek  = users.filter((u) => u.lastSeenAt && now.getTime() - u.lastSeenAt.getTime() < 7 * DAY).length
  const withMindbox = users.filter((u) => u.hasMindbox).length
  const withPush    = users.filter((u) => u._count.pushSubs > 0).length
  const sinSync     = users.filter((u) => u.noSync).length
  const dauWau      = activeWeek > 0 ? Math.round((activeToday / activeWeek) * 100) : 0

  // ── Segmentación ──────────────────────────────────────────────────────────
  const segCount: Record<Status, number> = { nuevo: 0, activo: 0, inactivo: 0, dormido: 0 }
  users.forEach((u) => segCount[u.status]++)

  const segConfig: Record<Status, { label: string; sub: string; color: string; bg: string; border: string }> = {
    nuevo:    { label: "Nuevos",    sub: "< 7 días",  color: "var(--blue)",  bg: "var(--blue-d)",  border: "var(--blue-b)"  },
    activo:   { label: "Activos",   sub: "visto < 3d", color: "var(--green)", bg: "var(--green-d)", border: "var(--green-b)" },
    inactivo: { label: "Inactivos", sub: "7 – 30 d",  color: "var(--amber)", bg: "var(--amber-d)", border: "var(--amber-b)" },
    dormido:  { label: "Dormidos",  sub: "> 30 días", color: "var(--tx3)",   bg: "var(--s3)",      border: "var(--b1)"      },
  }

  // ── Sparkline (14 días) ───────────────────────────────────────────────────
  const SPARK = 14
  const sparkData: number[] = Array(SPARK).fill(0)
  users.forEach((u) => {
    const daysAgo = Math.floor((now.getTime() - u.createdAt.getTime()) / DAY)
    if (daysAgo < SPARK) sparkData[SPARK - 1 - daysAgo]++
  })
  const sparkMax    = Math.max(...sparkData, 1)
  const sparkTotal  = sparkData.reduce((a, b) => a + b, 0)
  const sparkPrev   = sparkData.slice(0, 7).reduce((a, b) => a + b, 0)
  const sparkRecent = sparkData.slice(7).reduce((a, b) => a + b, 0)

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

          {/* ── Stats row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total",        value: totalUsers,             sub: "registrados",         color: "var(--tx)"    },
              { label: "DAU",          value: activeToday,            sub: "activos hoy",          color: "var(--green)" },
              { label: "WAU",          value: activeWeek,             sub: "activos esta semana",  color: "var(--blue)"  },
              { label: "DAU / WAU",    value: `${dauWau}%`,           sub: "retención diaria",     color: dauWau >= 40 ? "var(--green)" : dauWau >= 20 ? "var(--amber)" : "var(--red)" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
                <p className="text-[9px] uppercase tracking-[.1em] mb-1" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Segunda fila stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Sin sincronizar", value: sinSync,     sub: "nunca usaron sync",   color: sinSync > 0 ? "var(--amber)" : "var(--tx3)" },
              { label: "Con Mindbox",     value: withMindbox, sub: "credenciales activas", color: "var(--tx2)"  },
              { label: "Con Push",        value: withPush,    sub: "notificaciones",       color: "var(--blue)"  },
              { label: "Tasa adopción",   value: `${totalUsers > 0 ? Math.round(((totalUsers - sinSync) / totalUsers) * 100) : 0}%`,
                sub: "sync activado",   color: "var(--green)" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-3 text-center"
                style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
                <p className="text-[9px] uppercase tracking-[.1em] mb-1" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>{s.label}</p>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Segmentación + Sparkline ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Segmentación */}
            <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
              <p className="text-[10px] uppercase tracking-[.1em] mb-3" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                Segmentación de usuarios
              </p>
              <div className="space-y-3">
                {(["nuevo", "activo", "inactivo", "dormido"] as Status[]).map((key) => {
                  const cfg = segConfig[key]
                  const count = segCount[key]
                  const pct   = totalUsers > 0 ? (count / totalUsers) * 100 : 0
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] rounded px-1.5 py-0.5 font-semibold"
                            style={{ fontFamily: "var(--mono)", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {cfg.label.toUpperCase()}
                          </span>
                          <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>{cfg.sub}</span>
                        </div>
                        <span className="text-[12px] font-semibold" style={{ color: cfg.color }}>{count}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: cfg.color, opacity: 0.85 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sparkline */}
            <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                  Registros — últimos 14 días
                </p>
                <div className="text-right">
                  <p className="text-[18px] font-bold leading-none" style={{ color: "var(--blue)" }}>{sparkTotal}</p>
                  <p className="text-[9px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>total período</p>
                </div>
              </div>

              {/* Barras */}
              <div className="flex items-end gap-0.5 h-16">
                {sparkData.map((val, i) => {
                  const isRecent = i >= 7
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: "100%" }}>
                      <div className="rounded-sm w-full"
                        style={{
                          height: `${Math.max(val > 0 ? (val / sparkMax) * 100 : 0, val > 0 ? 10 : 2)}%`,
                          background: val > 0 ? (isRecent ? "var(--blue)" : "var(--blue)") : "var(--s3)",
                          opacity: val > 0 ? (isRecent ? 1 : 0.4) : 0.2,
                        }} />
                    </div>
                  )
                })}
              </div>

              {/* Labels */}
              <div className="flex justify-between mt-2">
                <span className="text-[9px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>−14d</span>
                <span className="text-[9px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>−7d</span>
                <span className="text-[9px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>hoy</span>
              </div>

              {/* Semana comparativa */}
              <div className="flex gap-3 mt-3 pt-3" style={{ borderTop: "1px solid var(--b1)" }}>
                <div>
                  <p className="text-[9px] uppercase tracking-[.08em]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>Sem. anterior</p>
                  <p className="text-[14px] font-semibold" style={{ color: "var(--tx2)" }}>{sparkPrev}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[.08em]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>Esta semana</p>
                  <p className="text-[14px] font-semibold" style={{ color: sparkRecent >= sparkPrev ? "var(--green)" : "var(--amber)" }}>
                    {sparkRecent}
                    <span className="text-[10px] ml-1">
                      {sparkRecent > sparkPrev ? "↑" : sparkRecent < sparkPrev ? "↓" : "="}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Users table (client — search + filter) ── */}
          <AdminUserTable users={users} />

        </div>
      </div>
    </div>
  )
}

