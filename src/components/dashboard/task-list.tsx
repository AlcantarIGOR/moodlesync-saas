"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Task } from "@prisma/client"
import { AddTaskModal } from "@/components/dashboard/add-task-modal"
import { TaskDetailModal } from "@/components/dashboard/task-detail-modal"
import { toast } from "@/lib/toast"

type Filter = "todas" | "pendientes" | "urgentes" | "completadas" | "archivadas"

function timeAgo(date: Date | null): string {
  if (!date) return "Sin fecha"
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 86400000)
  if (diff < 0) {
    const future = Math.abs(diff)
    if (future === 0) return "Hoy"
    if (future === 1) return "Mañana"
    return `en ${future}d`
  }
  if (diff === 0) return "Hoy"
  if (diff === 1) return "ayer"
  return `hace ${diff}d`
}

function taskStatus(task: Task): "completada" | "vencida" | "urgente" | "pendiente" {
  if (task.status === "DONE") return "completada"
  if (task.status === "ARCHIVED") return "pendiente"
  if (!task.dueDate) return "pendiente"
  const now = Date.now()
  const due = new Date(task.dueDate).getTime()
  if (due < now) return "vencida"
  if (due - now < 3 * 86400000) return "urgente"
  return "pendiente"
}

const STATUS_STYLE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  vencida:    { label: "VENCIDA",    bg: "var(--red-d)",    color: "var(--red)",    border: "var(--red-b)" },
  urgente:    { label: "URGENTE",    bg: "var(--amber-d)",  color: "var(--amber)",  border: "var(--amber-b)" },
  pendiente:  { label: "PENDIENTE",  bg: "var(--blue-d)",   color: "var(--blue)",   border: "var(--blue-b)" },
  completada: { label: "COMPLETADA", bg: "var(--green-d)",  color: "var(--green)",  border: "var(--green-b)" },
}

const COURSE_COLORS = [
  { bg: "var(--blue-d)",   color: "var(--blue)" },
  { bg: "var(--purple-d)", color: "var(--purple)" },
  { bg: "var(--green-d)",  color: "var(--green)" },
  { bg: "var(--amber-d)",  color: "var(--amber)" },
  { bg: "var(--red-d)",    color: "var(--red)" },
]
function courseColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff
  return COURSE_COLORS[h % COURSE_COLORS.length]
}

function TaskCard({ task, onOpen }: { task: Task; onOpen: (t: Task) => void }) {
  const router = useRouter()
  const [toggleLoading, setToggleLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [hovered, setHovered] = useState(false)
  const status = taskStatus(task)
  const st = STATUS_STYLE[status]
  const cc = task.courseName ? courseColor(task.courseName) : COURSE_COLORS[0]
  const shortName = task.courseName?.split(/\s+/).slice(-1)[0]?.slice(0, 10) ?? "—"
  const done = status === "completada"

  // Progress bar: % of urgency (0 = 2+ weeks out, 100 = past due)
  const progressPct = (() => {
    if (!task.dueDate || done) return null
    const msLeft = new Date(task.dueDate).getTime() - Date.now()
    const totalWindow = 14 * 86400000 // 2 weeks
    return Math.min(100, Math.max(0, Math.round((1 - msLeft / totalWindow) * 100)))
  })()
  const progressColor =
    progressPct === null ? null :
    progressPct >= 90 ? "var(--red)" :
    progressPct >= 65 ? "var(--amber)" :
    "var(--green)"

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    setToggleLoading(true)
    const newStatus = done ? "PENDING" : "DONE"
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      toast(done ? "Marcada como pendiente" : "¡Tarea completada!", done ? "info" : "success")
      router.refresh()
    } finally {
      setToggleLoading(false)
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("¿Eliminar esta tarea?")) return
    setDeleteLoading(true)
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" })
      toast("Tarea eliminada", "info")
      router.refresh()
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div
      className="rounded-xl p-4 transition-all cursor-pointer"
      style={{
        background: "var(--card)",
        border: "1px solid var(--b1)",
        opacity: done ? 0.55 : 1,
        transform: "translateY(0)",
        transition: "border-color .15s, transform .12s",
        position: "relative",
      }}
      onClick={() => onOpen(task)}
      onMouseEnter={(e) => {
        setHovered(true)
        e.currentTarget.style.borderColor = "var(--b2)"
        e.currentTarget.style.transform = "translateY(-1px)"
      }}
      onMouseLeave={(e) => {
        setHovered(false)
        e.currentTarget.style.borderColor = "var(--b1)"
        e.currentTarget.style.transform = "translateY(0)"
      }}
    >
      {/* Top row: course tag + actions */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="rounded px-2 py-0.5 text-[10px] font-medium"
            style={{ fontFamily: "var(--mono)", background: cc.bg, color: cc.color }}>
            {shortName}
          </span>
          {task.isManual && (
            <span className="rounded px-1.5 py-0.5 text-[9px]"
              style={{ fontFamily: "var(--mono)", background: "var(--s3)", color: "var(--tx3)", border: "1px solid var(--b1)" }}>
              manual
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Delete button — only on manual tasks, visible on hover */}
          {task.isManual && hovered && (
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
              style={{ background: "var(--red-d)", border: "1px solid var(--red-b)", color: "var(--red)", cursor: "pointer" }}
              title="Eliminar tarea"
            >
              {deleteLoading ? (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ animation: "spin .65s linear infinite" }}>
                  <circle cx="4.5" cy="4.5" r="3" stroke="currentColor" strokeWidth="1.3" strokeDasharray="10" strokeDashoffset="5"/>
                </svg>
              ) : (
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 2.5h6M3.5 2.5V1.5h2V2.5M2.5 2.5l.5 5h3l.5-5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          )}
          {/* Toggle checkbox */}
          <button
            onClick={toggle}
            disabled={toggleLoading}
            className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all"
            style={{
              border: done ? "none" : "1.5px solid var(--b2)",
              background: done ? "var(--green)" : "transparent",
            }}
          >
            {done && (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-[13px] font-medium leading-snug mb-1.5"
        style={{ color: "var(--tx)", textDecoration: done ? "line-through" : "none" }}>
        {task.title}
      </p>

      {/* Course full name as desc */}
      {task.courseName && (
        <p className="text-[11px] leading-relaxed mb-3 line-clamp-2" style={{ color: "var(--tx2)" }}>
          {task.courseName}
        </p>
      )}

      {/* Footer: status badge + date */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[.04em]"
            style={{ fontFamily: "var(--mono)", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
            {st.label}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] shrink-0"
          style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="1" y="2" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
            <path d="M3.5 1v2M7.5 1v2M1 5h9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          {timeAgo(task.dueDate)}
        </div>
      </div>

      {/* Progress bar */}
      {progressPct !== null && (
        <div className="mt-3 rounded-full overflow-hidden" style={{ height: 3, background: "var(--s3)" }}>
          <div style={{ width: `${progressPct}%`, height: "100%", background: progressColor!, borderRadius: 9999, transition: "width .3s ease" }} />
        </div>
      )}
    </div>
  )
}

const FILTER_LABELS: { id: Filter; label: string }[] = [
  { id: "todas",      label: "Todas" },
  { id: "pendientes", label: "Pendientes" },
  { id: "urgentes",   label: "Urgentes" },
  { id: "completadas",label: "Completadas" },
]

function toFilter(raw: string | undefined): Filter {
  if (raw === "pendientes" || raw === "urgentes" || raw === "completadas" || raw === "archivadas") return raw
  return "todas"
}

export function TaskList({ tasks, plan, moodleBaseUrl, initialFilter }: { tasks: Task[]; plan: string; moodleBaseUrl?: string; initialFilter?: string }) {
  const [filter, setFilter] = useState<Filter>(() => toFilter(initialFilter))
  const [search, setSearch] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  const filtered = tasks.filter((t) => {
    const s = taskStatus(t)
    const matchFilter =
      filter === "archivadas" ? t.status === "ARCHIVED" :
      filter === "todas" ? t.status !== "ARCHIVED" :
      filter === "pendientes" ? s === "pendiente" && t.status !== "ARCHIVED" :
      filter === "urgentes" ? (s === "urgente" || s === "vencida") && t.status !== "ARCHIVED" :
      s === "completada"
    const matchSearch = search === "" ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.courseName ?? "").toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const vencidas   = filtered.filter((t) => taskStatus(t) === "vencida")
  const urgentes   = filtered.filter((t) => taskStatus(t) === "urgente")
  const pendientes = filtered.filter((t) => taskStatus(t) === "pendiente")
  const completadas = filtered.filter((t) => taskStatus(t) === "completada")

  const sections = [
    { label: "VENCIDAS",   tasks: vencidas,   color: "var(--red)" },
    { label: "URGENTES",   tasks: urgentes,   color: "var(--amber)" },
    { label: "PENDIENTES", tasks: pendientes, color: "var(--blue)" },
    { label: "COMPLETADAS",tasks: completadas,color: "var(--green)" },
  ].filter((s) => s.tasks.length > 0)

  const manualCount = tasks.filter((t) => t.isManual).length
  const atLimit = plan === "FREE" && manualCount >= 3

  return (
    <>
      {showAddModal && (
        <AddTaskModal onClose={() => setShowAddModal(false)} />
      )}
      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          moodleBaseUrl={moodleBaseUrl}
          onClose={() => setDetailTask(null)}
        />
      )}

      <div>
        {/* Search + filter + add bar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-xs min-w-[180px]">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "var(--tx2)" }}>
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarea..."
              className="w-full h-[34px] rounded-lg pl-8 pr-3 text-xs outline-none"
              style={{
                background: "var(--s2)",
                border: "1px solid var(--b1)",
                color: "var(--tx)",
                fontFamily: "var(--mono)",
              }}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1">
            {FILTER_LABELS.map(({ id, label }) => (
              <button key={id} onClick={() => setFilter(id)}
                className="px-3 h-[34px] rounded-lg text-xs transition-all"
                style={{
                  fontFamily: "var(--mono)",
                  background: filter === id ? "var(--blue-d)" : "transparent",
                  color: filter === id ? "var(--blue)" : "var(--tx2)",
                  border: filter === id ? "1px solid var(--blue-b)" : "1px solid var(--b1)",
                  cursor: "pointer",
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Add task button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-xs font-semibold transition-all ml-auto"
            style={{
              background: atLimit ? "var(--s2)" : "var(--blue-d)",
              border: atLimit ? "1px solid var(--b1)" : "1px solid var(--blue-b)",
              color: atLimit ? "var(--tx2)" : "var(--blue)",
              cursor: "pointer",
            }}
            title={atLimit ? "Límite de plan gratuito alcanzado" : "Nueva tarea manual"}
          >
            {atLimit ? (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1.5L2 9.5h7L5.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M5.5 4.5v2.5M5.5 8v.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
            Nueva tarea
          </button>
        </div>

        {/* Freemium hint */}
        {plan === "FREE" && (
          <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-lg"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)" }}>
            <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Tareas manuales: <strong style={{ color: atLimit ? "var(--amber)" : "var(--tx)" }}>{manualCount}/3</strong>
            </span>
            <a href="/dashboard/upgrade" className="text-[11px] font-medium transition-all"
              style={{ fontFamily: "var(--mono)", color: "var(--blue)", textDecoration: "none" }}>
              Ver Premium →
            </a>
          </div>
        )}

        {/* Sections */}
        {sections.length === 0 ? (
          <div className="text-center py-12 text-xs" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
            Sin tareas.
          </div>
        ) : sections.map(({ label, tasks: sts, color }) => (
          <div key={label} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-[.1em]"
                style={{ fontFamily: "var(--mono)", color }}>
                {label}
              </span>
              <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                · {sts.length}
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--b1)" }} />
            </div>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(268px, 1fr))" }}>
              {sts.map((t) => <TaskCard key={t.id} task={t} onOpen={setDetailTask} />)}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
