"use client"

import { useState, useMemo } from "react"

type Status = "nuevo" | "activo" | "inactivo" | "dormido"

export type AdminUser = {
  id: string
  name: string | null
  moodleUsername: string | null
  email: string | null
  hasMindbox: boolean
  createdAt: Date
  lastSeenAt: Date | null
  status: Status
  noSync: boolean
  _count: { tasks: number; grades: number; schedule: number; pushSubs: number; notes: number }
}

const segConfig: Record<Status, { label: string; color: string; bg: string; border: string }> = {
  nuevo:    { label: "Nuevo",    color: "var(--blue)",  bg: "var(--blue-d)",  border: "var(--blue-b)"  },
  activo:   { label: "Activo",   color: "var(--green)", bg: "var(--green-d)", border: "var(--green-b)" },
  inactivo: { label: "Inactivo", color: "var(--amber)", bg: "var(--amber-d)", border: "var(--amber-b)" },
  dormido:  { label: "Dormido",  color: "var(--tx3)",   bg: "var(--s3)",      border: "var(--b1)"      },
}

const FILTERS = [
  { key: "todos",    label: "Todos"     },
  { key: "sin_sync", label: "Sin sync"  },
  { key: "nuevo",    label: "Nuevos"    },
  { key: "activo",   label: "Activos"   },
  { key: "inactivo", label: "Inactivos" },
  { key: "dormido",  label: "Dormidos"  },
] as const

type FilterKey = typeof FILTERS[number]["key"]

function relativeTime(date: Date | null): string {
  if (!date) return "—"
  const now  = Date.now()
  const diff = now - new Date(date).getTime()
  const DAY  = 86_400_000
  if (diff < 60_000)     return "ahora"
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m`
  if (diff < DAY)        return `${Math.floor(diff / 3_600_000)}h`
  if (diff < 7 * DAY)    return `${Math.floor(diff / DAY)}d`
  return new Date(date).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
}

function Chip({ label, color }: { label: string; color?: "green" | "blue" | "amber" }) {
  const s = {
    green:   { bg: "var(--green-d)", border: "var(--green-b)", text: "var(--green)" },
    blue:    { bg: "var(--blue-d)",  border: "var(--blue-b)",  text: "var(--blue)"  },
    amber:   { bg: "var(--amber-d)", border: "var(--amber-b)", text: "var(--amber)" },
    default: { bg: "var(--s3)",      border: "var(--b1)",      text: "var(--tx2)"   },
  }[color ?? "default"]
  return (
    <span className="text-[10px] rounded px-1.5 py-0.5"
      style={{ fontFamily: "var(--mono)", background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
      {label}
    </span>
  )
}

const getNow = () => Date.now()

export function AdminUserTable({ users }: { users: AdminUser[] }) {
  const [query,     setQuery]     = useState("")
  const [activeFilter, setFilter] = useState<FilterKey>("todos")
  const now = useMemo(() => getNow(), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      // Status filter
      if (activeFilter === "sin_sync" && !u.noSync)           return false
      if (activeFilter !== "todos" && activeFilter !== "sin_sync" && u.status !== activeFilter) return false
      // Text search
      if (!q) return true
      return (
        u.name?.toLowerCase().includes(q)          ||
        u.moodleUsername?.toLowerCase().includes(q)||
        u.email?.toLowerCase().includes(q)         ||
        u.status.includes(q)
      )
    })
  }, [users, query, activeFilter])

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>

      {/* Header + search */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search input */}
          <div className="relative flex-1 min-w-[180px]">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              width="12" height="12" viewBox="0 0 16 16" fill="none"
              style={{ color: "var(--tx3)" }}>
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar nombre, N° control, email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: 28,
                paddingRight: 10,
                paddingTop: 5,
                paddingBottom: 5,
                fontSize: 11,
                fontFamily: "var(--mono)",
                background: "var(--s3)",
                border: "1px solid var(--b2)",
                borderRadius: 8,
                color: "var(--tx)",
                outline: "none",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--blue)" }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = "var(--b2)"   }}
            />
            {query && (
              <button onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2"
                style={{ color: "var(--tx3)", lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>

          {/* Quick filters */}
          <div className="flex gap-1 flex-wrap">
            {FILTERS.map((f) => {
              const active = activeFilter === f.key
              return (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className="text-[10px] px-2.5 py-1 rounded-lg transition-all"
                  style={{
                    fontFamily: "var(--mono)",
                    background: active ? "var(--blue)"   : "var(--s3)",
                    color:      active ? "#fff"          : "var(--tx2)",
                    border:     `1px solid ${active ? "var(--blue)" : "var(--b1)"}`,
                  }}>
                  {f.label}
                </button>
              )
            })}
          </div>

          {/* Result count */}
          <span className="text-[10px] shrink-0" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
            {filtered.length} / {users.length}
          </span>
        </div>
      </div>

      {/* Table header */}
      <div className="hidden md:grid px-4 py-2 text-[10px] uppercase tracking-[.07em]"
        style={{
          gridTemplateColumns: "1fr 100px 50px 50px 50px 50px 55px 70px 70px",
          fontFamily: "var(--mono)", color: "var(--tx3)",
          borderBottom: "1px solid var(--b1)", background: "var(--s2)",
        }}>
        <span>Nombre</span>
        <span>N° Control</span>
        <span className="text-center">Tareas</span>
        <span className="text-center">Califs</span>
        <span className="text-center">Clases</span>
        <span className="text-center">Notas</span>
        <span className="text-center">Mindbox</span>
        <span className="text-right">Registro</span>
        <span className="text-right">Visto</span>
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: "var(--b1)" }}>
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-[12px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
            Sin resultados para &ldquo;{query}&rdquo;
          </div>
        )}

        {filtered.map((u) => {
          const cfg          = segConfig[u.status]
          const seenRecently = u.lastSeenAt && now - new Date(u.lastSeenAt).getTime() < 86_400_000

          return (
            <>
              {/* Desktop row */}
              <div key={u.id}
                className="hidden md:grid px-4 py-3 items-center text-[12px]"
                style={{ gridTemplateColumns: "1fr 100px 50px 50px 50px 50px 55px 70px 70px" }}>

                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <p className="font-medium truncate" style={{ color: "var(--tx)" }}>{u.name}</p>
                    <span className="text-[8px] shrink-0 rounded px-1 py-0.5 font-semibold"
                      style={{ fontFamily: "var(--mono)", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label.toUpperCase()}
                    </span>
                    {u.noSync && (
                      <span className="text-[8px] shrink-0 rounded px-1 py-0.5 font-semibold"
                        style={{ fontFamily: "var(--mono)", background: "var(--amber-d)", color: "var(--amber)", border: "1px solid var(--amber-b)" }}>
                        SIN SYNC
                      </span>
                    )}
                  </div>
                  {u.email && (
                    <p className="text-[10px] truncate" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>{u.email}</p>
                  )}
                </div>

                <span style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>{u.moodleUsername}</span>

                <span className="text-center" style={{ color: u._count.tasks    > 0 ? "var(--tx)" : "var(--tx3)" }}>{u._count.tasks}</span>
                <span className="text-center" style={{ color: u._count.grades   > 0 ? "var(--tx)" : "var(--tx3)" }}>{u._count.grades}</span>
                <span className="text-center" style={{ color: u._count.schedule > 0 ? "var(--tx)" : "var(--tx3)" }}>{u._count.schedule}</span>
                <span className="text-center" style={{ color: u._count.notes    > 0 ? "var(--tx)" : "var(--tx3)" }}>{u._count.notes}</span>

                <span className="text-center">
                  <span className="text-[9px] rounded px-1.5 py-0.5 font-semibold"
                    style={{
                      fontFamily: "var(--mono)",
                      background: u.hasMindbox ? "var(--green-d)" : "var(--s3)",
                      color:      u.hasMindbox ? "var(--green)"   : "var(--tx3)",
                      border:     `1px solid ${u.hasMindbox ? "var(--green-b)" : "var(--b1)"}`,
                    }}>
                    {u.hasMindbox ? "SÍ" : "NO"}
                  </span>
                </span>

                <span className="text-right" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                  {relativeTime(u.createdAt)}
                </span>
                <span className="text-right font-semibold"
                  style={{ fontFamily: "var(--mono)", color: seenRecently ? "var(--green)" : "var(--tx3)" }}>
                  {relativeTime(u.lastSeenAt)}
                </span>
              </div>

              {/* Mobile card */}
              <div key={u.id + "-m"} className="md:hidden px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[13px] font-medium" style={{ color: "var(--tx)" }}>{u.name}</p>
                      <span className="text-[8px] rounded px-1 py-0.5 font-semibold"
                        style={{ fontFamily: "var(--mono)", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                        {cfg.label.toUpperCase()}
                      </span>
                    </div>
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
                  <Chip label={`${u._count.notes} notas`} />
                  {u.hasMindbox && <Chip label="Mindbox" color="green" />}
                  {u.noSync && <Chip label="Sin sync" color="amber" />}
                </div>
              </div>
            </>
          )
        })}
      </div>
    </div>
  )
}
