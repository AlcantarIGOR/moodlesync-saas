"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

interface TaskResult {
  id: string
  title: string
  courseName: string | null
  dueDate: string | null
  status: string
}

const NAV_ITEMS = [
  { label: "Dashboard",      href: "/dashboard",               hint: "página principal" },
  { label: "Todas las tareas", href: "/dashboard/tareas",      hint: "lista completa" },
  { label: "Urgentes",       href: "/dashboard/tareas?filter=urgentes",    hint: "vencen pronto" },
  { label: "Kanban",         href: "/dashboard/kanban",        hint: "vista tablero" },
  { label: "Calificaciones", href: "/dashboard/calificaciones",hint: "notas de Moodle" },
  { label: "Configuración",  href: "/dashboard/settings",      hint: "perfil y email" },
]

function fmtDate(d: string | null): string {
  if (!d) return ""
  const diff = Math.round((new Date(d).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `vencida hace ${Math.abs(diff)}d`
  if (diff === 0) return "vence hoy"
  return `en ${diff}d`
}

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [tasks, setTasks] = useState<TaskResult[]>([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery("")
    setTasks([])
    setSelected(0)
  }, [])

  // Open on cmd+K / ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") close()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [close])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Debounced task search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!open) return

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/tasks?q=${encodeURIComponent(query)}`)
        if (res.ok) setTasks(await res.json())
      } finally {
        setLoading(false)
      }
    }, 200)
  }, [query, open])

  const navResults = query
    ? NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
    : NAV_ITEMS

  const allItems = [
    ...navResults.map((n) => ({ type: "nav" as const, ...n })),
    ...tasks.map((t) => ({ type: "task" as const, ...t })),
  ]

  function go(idx: number) {
    const item = allItems[idx]
    if (!item) return
    if (item.type === "nav") router.push(item.href)
    else router.push(`/dashboard/tareas`)
    close()
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, allItems.length - 1)) }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
    if (e.key === "Enter")     { e.preventDefault(); go(selected) }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: "rgba(0,0,0,.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div
        className="w-full max-w-[520px] rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--b2)", boxShadow: "0 24px 64px rgba(0,0,0,.5)" }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4" style={{ borderBottom: "1px solid var(--b1)" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--tx2)", flexShrink: 0 }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={onKeyDown}
            placeholder="Buscar tareas, páginas..."
            className="flex-1 py-4 bg-transparent text-sm outline-none"
            style={{ color: "var(--tx)", fontFamily: "var(--mono)" }}
          />
          {loading && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ animation: "spin .65s linear infinite", flexShrink: 0 }}>
              <circle cx="6" cy="6" r="4" stroke="var(--tx2)" strokeWidth="1.5" strokeDasharray="10" strokeDashoffset="5"/>
            </svg>
          )}
          <kbd style={{ fontSize: 10, fontFamily: "var(--mono)", color: "var(--tx2)", background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 4, padding: "2px 5px" }}>esc</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {/* Nav section */}
          {navResults.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[.12em]"
                style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Páginas
              </p>
              {navResults.map((item, i) => {
                const idx = i
                return (
                  <button
                    key={item.href}
                    onClick={() => go(idx)}
                    onMouseEnter={() => setSelected(idx)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      background: selected === idx ? "var(--blue-d)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: selected === idx ? "var(--blue)" : "var(--tx2)", flexShrink: 0 }}>
                      <path d="M1 6.5h11M7 2l4.5 4.5L7 11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[13px]" style={{ color: selected === idx ? "var(--blue)" : "var(--tx)" }}>{item.label}</span>
                    <span className="text-[11px] ml-auto" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>{item.hint}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Tasks section */}
          {tasks.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[9px] uppercase tracking-[.12em]"
                style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Tareas
              </p>
              {tasks.map((task, i) => {
                const idx = navResults.length + i
                return (
                  <button
                    key={task.id}
                    onClick={() => go(idx)}
                    onMouseEnter={() => setSelected(idx)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{
                      background: selected === idx ? "var(--blue-d)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: task.status === "DONE" ? "var(--green)" : "var(--blue)" }}
                    />
                    <span className="text-[13px] flex-1 truncate" style={{ color: selected === idx ? "var(--blue)" : "var(--tx)" }}>
                      {task.title}
                    </span>
                    <span className="text-[10px] shrink-0" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                      {fmtDate(task.dueDate)}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {allItems.length === 0 && query && (
            <p className="px-4 py-8 text-center text-xs" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Sin resultados para "{query}"
            </p>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2.5" style={{ borderTop: "1px solid var(--b1)" }}>
          {[["↑↓", "navegar"], ["↵", "abrir"], ["esc", "cerrar"]].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              <kbd style={{ background: "var(--s2)", border: "1px solid var(--b1)", borderRadius: 3, padding: "1px 4px", fontSize: 10 }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
