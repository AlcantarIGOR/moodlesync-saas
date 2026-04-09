"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  onClose: () => void
}

export function AddTaskModal({ onClose }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [courseName, setCourseName] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          courseName: courseName.trim() || null,
          dueDate: dueDate || null,
        }),
      })

      if (!res.ok) {
        setError("Error al crear la tarea")
        return
      }

      router.refresh()
      onClose()
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  // Backdrop click closes modal
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  // ── Create form ─────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-sm rounded-2xl animate-fadein"
        style={{ background: "var(--card)", border: "1px solid var(--b1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--b1)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--tx)" }}>Nueva tarea manual</p>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-all"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] mb-1.5 uppercase tracking-[.08em]"
              style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Título <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Proyecto final de POO"
              required
              autoFocus
              className="w-full h-9 rounded-lg px-3 text-[13px] outline-none login-input"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx)" }}
            />
          </div>

          {/* Course */}
          <div>
            <label className="block text-[10px] mb-1.5 uppercase tracking-[.08em]"
              style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Materia <span style={{ color: "var(--tx3)" }}>(opcional)</span>
            </label>
            <input
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Ej. Programación Orientada a Objetos"
              className="w-full h-9 rounded-lg px-3 text-[13px] outline-none login-input"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx)" }}
            />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-[10px] mb-1.5 uppercase tracking-[.08em]"
              style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Fecha límite <span style={{ color: "var(--tx3)" }}>(opcional)</span>
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-9 rounded-lg px-3 text-[12px] outline-none login-input"
              style={{
                background: "var(--s2)",
                border: "1px solid var(--b1)",
                color: dueDate ? "var(--tx)" : "var(--tx3)",
                fontFamily: "var(--mono)",
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[11px] px-3 py-2 rounded-lg"
              style={{ fontFamily: "var(--mono)", color: "var(--red)", background: "var(--red-d)", border: "1px solid var(--red-b)" }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs transition-all"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--blue)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", border: "none" }}
            >
              {loading ? "Creando..." : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
