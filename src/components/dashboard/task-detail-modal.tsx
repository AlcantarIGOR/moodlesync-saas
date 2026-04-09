"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Task } from "@prisma/client"
import { toast } from "@/lib/toast"

interface MoodleFile {
  filename: string
  fileurl: string
  filesize: number
  mimetype?: string
}

function fileIcon(mimetype?: string) {
  if (!mimetype) return "📄"
  if (mimetype.includes("pdf")) return "📕"
  if (mimetype.includes("image")) return "🖼️"
  if (mimetype.includes("word") || mimetype.includes("document")) return "📝"
  if (mimetype.includes("zip") || mimetype.includes("compressed")) return "📦"
  if (mimetype.includes("spreadsheet") || mimetype.includes("excel")) return "📊"
  return "📄"
}

function formatSize(bytes: number): string {
  if (bytes === 0) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fmtDate(date: Date | null): string {
  if (!date) return "Sin fecha"
  return new Date(date).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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

const STATUS_STYLE = {
  vencida:    { label: "VENCIDA",    bg: "var(--red-d)",   color: "var(--red)",   border: "var(--red-b)" },
  urgente:    { label: "URGENTE",    bg: "var(--amber-d)", color: "var(--amber)", border: "var(--amber-b)" },
  pendiente:  { label: "PENDIENTE",  bg: "var(--blue-d)",  color: "var(--blue)",  border: "var(--blue-b)" },
  completada: { label: "COMPLETADA", bg: "var(--green-d)", color: "var(--green)", border: "var(--green-b)" },
}

interface Props {
  task: Task
  onClose: () => void
  moodleBaseUrl?: string
}

function SafeHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function sanitize() {
      if (!ref.current) return
      const DOMPurify = (await import("dompurify")).default
      ref.current.innerHTML = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["p","br","strong","b","em","i","u","ul","ol","li","h1","h2","h3","h4","a","img","span","div","pre","code","blockquote","table","thead","tbody","tr","th","td"],
        ALLOWED_ATTR: ["href","src","alt","title","target","rel","class","style"],
      })
    }
    sanitize()
  }, [html])

  return (
    <div
      ref={ref}
      className="moodle-html text-[12px] leading-relaxed"
      style={{ color: "var(--tx2)" }}
    />
  )
}

export function TaskDetailModal({ task, onClose, moodleBaseUrl }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const status = taskStatus(task)
  const st = STATUS_STYLE[status]
  const done = status === "completada"

  // Parse attachments from JSON
  const attachments: MoodleFile[] = Array.isArray(task.attachments)
    ? (task.attachments as unknown as MoodleFile[])
    : []

  async function toggle() {
    setLoading(true)
    const newStatus = done ? "PENDING" : "DONE"
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      toast(done ? "Marcada como pendiente" : "¡Tarea completada!", done ? "info" : "success")
      router.refresh()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  function handleBackdrop(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  // Moodle direct link (uses cmid if available)
  const moodleLink = task.moodleCmId && moodleBaseUrl
    ? `${moodleBaseUrl}/mod/assign/view.php?id=${task.moodleCmId}`
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }}
      onClick={handleBackdrop}
    >
      <div
        className="w-full max-w-lg rounded-2xl flex flex-col animate-fadein"
        style={{ background: "var(--card)", border: "1px solid var(--b1)", maxHeight: "85vh" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--b1)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold leading-snug" style={{ color: "var(--tx)" }}>
              {task.title}
            </p>
            {task.courseName && (
              <p className="text-[11px] mt-1 truncate" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                {task.courseName}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Status + date row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-[.06em]"
              style={{ fontFamily: "var(--mono)", background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              {st.label}
            </span>
            <div className="flex items-center gap-1.5 text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="1.5" width="10" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M1 5h10" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M4 0.5v2M8 0.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {fmtDate(task.dueDate)}
            </div>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            {task.semester ? (
              <span className="rounded px-2 py-0.5 text-[10px]"
                style={{ fontFamily: "var(--mono)", background: "var(--s3)", color: "var(--tx2)", border: "1px solid var(--b1)" }}>
                {task.semester}° semestre
              </span>
            ) : null}
            {task.isManual && (
              <span className="rounded px-2 py-0.5 text-[10px]"
                style={{ fontFamily: "var(--mono)", background: "var(--s3)", color: "var(--tx3)", border: "1px solid var(--b1)" }}>
                manual
              </span>
            )}
          </div>

          {/* Description */}
          {task.description ? (
            <div>
              <p className="text-[10px] uppercase tracking-[.1em] mb-2"
                style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Descripción
              </p>
              <div className="rounded-xl p-3.5"
                style={{ background: "var(--s2)", border: "1px solid var(--b1)" }}>
                <SafeHtml html={task.description} />
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-3.5 text-center text-[11px]"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", fontFamily: "var(--mono)", color: "var(--tx3)" }}>
              Sin descripción
            </div>
          )}

          {/* Attachments */}
          {attachments.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[.1em] mb-2"
                style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Archivos adjuntos · {attachments.length}
              </p>
              <div className="space-y-1.5">
                {attachments.map((file) => (
                  <a
                    key={file.fileurl}
                    href={`/api/moodle/file?url=${encodeURIComponent(file.fileurl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                    style={{ background: "var(--s2)", border: "1px solid var(--b1)", textDecoration: "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--b2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--b1)")}
                  >
                    <span className="text-base shrink-0">{fileIcon(file.mimetype)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[12px] truncate" style={{ color: "var(--tx)" }}>
                        {file.filename}
                      </span>
                      {file.filesize > 0 && (
                        <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                          {formatSize(file.filesize)}
                        </span>
                      )}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                      <path d="M2 10l8-8M10 2H4M10 2v6" stroke="var(--blue)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 flex items-center gap-2 shrink-0"
          style={{ borderTop: "1px solid var(--b1)" }}>
          {moodleLink && (
            <a
              href={moodleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs transition-all"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", textDecoration: "none" }}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 9.5l8-8M9.5 1.5H4M9.5 1.5v5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ver en Moodle
            </a>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-xs transition-all"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
          >
            Cerrar
          </button>
          <button
            onClick={toggle}
            disabled={loading}
            className="h-9 px-4 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              background: done ? "var(--s2)" : "var(--green)",
              border: done ? "1px solid var(--b1)" : "none",
              color: done ? "var(--tx2)" : "#fff",
              cursor: "pointer",
            }}
          >
            {loading ? "..." : done ? "Marcar pendiente" : "Marcar como hecha"}
          </button>
        </div>
      </div>
    </div>
  )
}
