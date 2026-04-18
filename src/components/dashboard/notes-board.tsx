"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { Note } from "@prisma/client"
import gsap from "gsap"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NoteColor = "yellow" | "blue" | "green" | "pink" | "purple"

export type SharedNote = {
  id: string
  userId: string
  content: string
  color: string
  pinned: boolean
  courseId: number | null
  courseName: string | null
  createdAt: string
  updatedAt: string
  authorName: string
  viewX: number | null
  viewY: number | null
}

type SharedNoteLocal = SharedNote & { localX: number; localY: number }

type Course = { id: number; name: string }

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------

const COLORS: Record<NoteColor, { bg: string; border: string; dot: string; text: string }> = {
  yellow: { bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.28)", dot: "#f59e0b", text: "#fcd34d" },
  blue:   { bg: "rgba(75,140,248,0.10)",  border: "rgba(75,140,248,0.28)",  dot: "#4b8cf8", text: "#93c5fd" },
  green:  { bg: "rgba(34,197,94,0.10)",   border: "rgba(34,197,94,0.28)",   dot: "#22c55e", text: "#86efac" },
  pink:   { bg: "rgba(236,72,153,0.10)",  border: "rgba(236,72,153,0.28)",  dot: "#ec4899", text: "#f9a8d4" },
  purple: { bg: "rgba(139,92,246,0.10)",  border: "rgba(139,92,246,0.28)",  dot: "#8b5cf6", text: "#c4b5fd" },
}

const COLOR_KEYS = Object.keys(COLORS) as NoteColor[]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function randomOffset(base: number, range: number) {
  return base + Math.floor(Math.random() * range)
}

function spreadPosition(index: number): { x: number; y: number } {
  const col = index % 5
  const row = Math.floor(index / 5)
  return { x: 80 + col * 260, y: 80 + row * 220 }
}

// ---------------------------------------------------------------------------
// NoteCard (personal — editable)
// ---------------------------------------------------------------------------

function NoteCard({
  note,
  onPointerDown,
  onContentChange,
  onColorChange,
  onDelete,
  onPinToggle,
  onShareClick,
  zIndex,
  onFocus,
}: {
  note: Note
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void
  onContentChange: (id: string, content: string) => void
  onColorChange: (id: string, color: NoteColor) => void
  onDelete: (id: string) => void
  onPinToggle: (id: string, pinned: boolean) => void
  onShareClick: (id: string, currentCourseId: number | null) => void
  zIndex: number
  onFocus: (id: string) => void
}) {
  const color = COLORS[(note.color as NoteColor) ?? "yellow"] ?? COLORS.yellow
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isShared = (note as Note & { shared?: boolean }).shared === true

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [note.content])

  return (
    <div
      id={`note-${note.id}`}
      style={{
        position: "absolute",
        left: note.x,
        top: note.y,
        width: 220,
        zIndex,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 12,
        boxShadow: note.pinned
          ? `0 0 0 2px ${color.dot}, 0 8px 24px rgba(0,0,0,0.4)`
          : "0 4px 16px rgba(0,0,0,0.3)",
        userSelect: "none",
        willChange: "transform",
      }}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("textarea") || target.closest("button")) return
        onPointerDown(e, note.id)
        onFocus(note.id)
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-2.5 pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        {COLOR_KEYS.map((c) => (
          <button
            key={c}
            onClick={() => onColorChange(note.id, c)}
            style={{
              width: 10, height: 10, borderRadius: "50%",
              background: COLORS[c].dot,
              border: c === note.color ? "2px solid rgba(255,255,255,0.6)" : "2px solid transparent",
              cursor: "pointer", padding: 0, flexShrink: 0,
            }}
            title={c}
          />
        ))}

        <div style={{ flex: 1 }} />

        {/* Share indicator */}
        {isShared && (
          <span style={{
            fontSize: 9, fontFamily: "var(--mono)", color: color.dot,
            background: `${color.bg}`, border: `1px solid ${color.border}`,
            borderRadius: 4, padding: "1px 4px", letterSpacing: ".3px",
          }}>
            compartida
          </span>
        )}

        {/* Share button */}
        <button
          onClick={() => onShareClick(note.id, (note as Note & { courseId?: number | null }).courseId ?? null)}
          style={{
            color: isShared ? color.dot : "var(--tx3)",
            background: "none", border: "none", cursor: "pointer",
            padding: "2px", display: "flex", alignItems: "center",
          }}
          title={isShared ? "Cambiar / dejar de compartir" : "Compartir con una materia"}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <circle cx="9.5" cy="2.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="9.5" cy="9.5" r="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <circle cx="2.5" cy="6"   r="1.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M4 5.3L8 3M4 6.7L8 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Pin button */}
        <button
          onClick={() => onPinToggle(note.id, !note.pinned)}
          style={{ color: note.pinned ? color.dot : "var(--tx3)", background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
          title={note.pinned ? "Desfijar" : "Fijar"}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
            <path d="M9 1L8 2 7.5 4.5 10 5l-3 3-1-1-3 3v2h2l3-3-1-1 3-3 .5 2.5L11 4l1-1L9 1z" opacity="0.9"/>
          </svg>
        </button>

        {/* Delete button */}
        <button
          onClick={() => onDelete(note.id)}
          style={{ color: "var(--tx3)", background: "none", border: "none", cursor: "pointer", padding: "2px", display: "flex", alignItems: "center" }}
          title="Eliminar"
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--red)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--tx3)")}
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={note.content}
        placeholder="Escribe algo…"
        onChange={(e) => {
          onContentChange(note.id, e.target.value)
          e.target.style.height = "auto"
          e.target.style.height = `${e.target.scrollHeight}px`
        }}
        onFocus={() => onFocus(note.id)}
        style={{
          display: "block", width: "100%", minHeight: 72, resize: "none",
          background: "transparent", border: "none", outline: "none",
          padding: "0 12px 12px",
          fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.55,
          color: "var(--tx)", cursor: "text", overflowY: "hidden",
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// SharedNoteCard (readonly — viewer only drags)
// ---------------------------------------------------------------------------

function SharedNoteCard({
  note,
  onPointerDown,
  zIndex,
  onFocus,
}: {
  note: SharedNoteLocal
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void
  zIndex: number
  onFocus: (id: string) => void
}) {
  const color = COLORS[(note.color as NoteColor) ?? "yellow"] ?? COLORS.yellow

  return (
    <div
      id={`shared-${note.id}`}
      style={{
        position: "absolute",
        left: note.localX,
        top: note.localY,
        width: 220,
        zIndex,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
        userSelect: "none",
        willChange: "transform",
      }}
      onPointerDown={(e) => {
        const target = e.target as HTMLElement
        if (target.closest("button")) return
        onPointerDown(e, note.id)
        onFocus(note.id)
      }}
    >
      {/* Header con autor */}
      <div
        className="flex items-center gap-1.5 px-2.5 pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
      >
        <span style={{
          fontSize: 10, fontFamily: "var(--mono)", color: color.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          maxWidth: 120,
        }}>
          {note.authorName}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 9, fontFamily: "var(--mono)", color: "var(--tx3)",
          border: "1px solid var(--b2)", borderRadius: 4, padding: "1px 4px",
        }}>
          {note.courseName ?? ""}
        </span>
      </div>

      {/* Content readonly */}
      <div style={{
        padding: "0 12px 12px",
        fontFamily: "var(--sans)", fontSize: 13, lineHeight: 1.55,
        color: "var(--tx)", minHeight: 72, whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {note.content || <span style={{ color: "var(--tx3)", fontStyle: "italic" }}>Sin contenido</span>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ShareModal
// ---------------------------------------------------------------------------

function ShareModal({
  noteId,
  currentCourseId,
  courses,
  onConfirm,
  onCancel,
}: {
  noteId: string
  currentCourseId: number | null
  courses: Course[]
  onConfirm: (noteId: string, course: Course | null) => void
  onCancel: () => void
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        background: "var(--s1)", border: "1px solid var(--b1)", borderRadius: 16,
        padding: 24, width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: 15, color: "var(--tx)" }}>
          Compartir nota
        </p>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: "var(--tx2)" }}>
          Todos los compañeros de la materia podrán verla.
        </p>

        {courses.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--tx3)" }}>
            Sincroniza tus tareas primero para ver tus materias.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => onConfirm(noteId, c)}
                style={{
                  padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                  background: currentCourseId === c.id ? "rgba(75,140,248,0.15)" : "var(--s2)",
                  border: currentCourseId === c.id ? "1px solid rgba(75,140,248,0.5)" : "1px solid var(--b1)",
                  color: currentCourseId === c.id ? "var(--blue)" : "var(--tx)",
                  fontSize: 13, textAlign: "left", fontFamily: "var(--sans)",
                  transition: "background .15s, border .15s",
                }}
              >
                {currentCourseId === c.id ? "✓ " : ""}{c.name}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          {currentCourseId !== null && (
            <button
              onClick={() => onConfirm(noteId, null)}
              style={{
                padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                background: "transparent", border: "1px solid var(--b2)",
                color: "var(--tx2)", fontSize: 12, fontFamily: "var(--sans)",
              }}
            >
              Dejar de compartir
            </button>
          )}
          <button
            onClick={onCancel}
            style={{
              padding: "8px 14px", borderRadius: 8, cursor: "pointer",
              background: "var(--s2)", border: "1px solid var(--b1)",
              color: "var(--tx)", fontSize: 12, fontFamily: "var(--sans)",
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Canvas background (reutilizable)
// ---------------------------------------------------------------------------

const CANVAS_BG = `
  radial-gradient(circle at 50% 50%, rgba(75,140,248,0.03) 0%, transparent 70%),
  repeating-linear-gradient(0deg, transparent, transparent 39px, var(--b1) 39px, var(--b1) 40px),
  repeating-linear-gradient(90deg, transparent, transparent 39px, var(--b1) 39px, var(--b1) 40px)
`

// ---------------------------------------------------------------------------
// NotesBoard
// ---------------------------------------------------------------------------

export function NotesBoard({
  initialNotes,
  initialSharedNotes,
  courses,
  userId,
}: {
  initialNotes: Note[]
  initialSharedNotes: SharedNote[]
  courses: Course[]
  userId: string
}) {
  const [tab, setTab] = useState<"mine" | "shared">("mine")
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [sharedNotes, setSharedNotes] = useState<SharedNoteLocal[]>(() =>
    initialSharedNotes.map((n, i) => ({
      ...n,
      localX: n.viewX ?? spreadPosition(i).x,
      localY: n.viewY ?? spreadPosition(i).y,
    }))
  )
  const [zOrder, setZOrder] = useState<string[]>(() => initialNotes.map((n) => n.id))
  const [sharedZOrder, setSharedZOrder] = useState<string[]>(() => initialSharedNotes.map((n) => n.id))
  const [shareModal, setShareModal] = useState<{ noteId: string; currentCourseId: number | null } | null>(null)

  const boardRef = useRef<HTMLDivElement>(null)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const contentTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Drag state
  const draggingId = useRef<string | null>(null)
  const draggingIsShared = useRef(false)
  const dragNodeRef = useRef<HTMLElement | null>(null)
  const offsetX = useRef(0)
  const offsetY = useRef(0)
  const onDocMove = useRef<(e: PointerEvent) => void>(() => {})
  const onDocUp = useRef<(e: PointerEvent) => void>(() => {})

  const endDrag = useCallback(() => {
    document.removeEventListener("pointermove", onDocMove.current)
    document.removeEventListener("pointerup", onDocUp.current)
    document.removeEventListener("pointercancel", onDocUp.current)
    draggingId.current = null
    dragNodeRef.current = null
  }, [])

  const startDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string, isShared: boolean) => {
      if (e.button !== 0 && e.pointerType === "mouse") return
      e.preventDefault()
      e.stopPropagation()

      const prefix = isShared ? "shared-" : "note-"
      const noteEl = document.getElementById(`${prefix}${id}`)
      if (!noteEl) return

      draggingId.current = id
      draggingIsShared.current = isShared
      dragNodeRef.current = noteEl

      const rect = noteEl.getBoundingClientRect()
      const board = boardRef.current?.getBoundingClientRect()
      offsetX.current = e.clientX - rect.left
      offsetY.current = e.clientY - rect.top

      noteEl.style.cursor = "grabbing"
      noteEl.style.transition = "none"
      noteEl.style.zIndex = "9999"

      onDocMove.current = (ev: PointerEvent) => {
        if (!dragNodeRef.current || !boardRef.current) return
        const boardRect = boardRef.current.getBoundingClientRect()
        const x = clamp(
          ev.clientX - boardRect.left - offsetX.current + boardRef.current.scrollLeft,
          0, boardRef.current.scrollWidth - 220
        )
        const y = clamp(
          ev.clientY - boardRect.top - offsetY.current + boardRef.current.scrollTop,
          0, boardRef.current.scrollHeight - 60
        )
        dragNodeRef.current.style.left = `${x}px`
        dragNodeRef.current.style.top = `${y}px`
      }

      onDocUp.current = (ev: PointerEvent) => {
        const dragId = draggingId.current
        const dragShared = draggingIsShared.current
        if (!dragId || !dragNodeRef.current || !boardRef.current) { endDrag(); return }

        const boardRect = boardRef.current.getBoundingClientRect()
        const x = clamp(
          ev.clientX - boardRect.left - offsetX.current + boardRef.current.scrollLeft,
          0, boardRef.current.scrollWidth - 220
        )
        const y = clamp(
          ev.clientY - boardRect.top - offsetY.current + boardRef.current.scrollTop,
          0, boardRef.current.scrollHeight - 60
        )

        dragNodeRef.current.style.cursor = ""
        dragNodeRef.current.style.zIndex = ""
        endDrag()

        if (dragShared) {
          setSharedNotes((prev) =>
            prev.map((n) => (n.id === dragId ? { ...n, localX: x, localY: y } : n))
          )
          clearTimeout(saveTimers.current[`s-${dragId}`])
          saveTimers.current[`s-${dragId}`] = setTimeout(() => {
            fetch(`/api/notes/${dragId}/position`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ x, y }),
            }).catch(() => {})
          }, 400)
        } else {
          setNotes((prev) =>
            prev.map((n) => (n.id === dragId ? { ...n, x, y } : n))
          )
          clearTimeout(saveTimers.current[dragId])
          saveTimers.current[dragId] = setTimeout(() => {
            fetch(`/api/notes/${dragId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ x, y }),
            }).catch(() => {})
          }, 400)
        }
      }

      document.addEventListener("pointermove", onDocMove.current)
      document.addEventListener("pointerup", onDocUp.current)
      document.addEventListener("pointercancel", onDocUp.current)
    },
    [endDrag]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string) => startDrag(e, id, false),
    [startDrag]
  )
  const handleSharedPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string) => startDrag(e, id, true),
    [startDrag]
  )

  const handleFocus = useCallback((id: string) => {
    setZOrder((prev) => prev[prev.length - 1] === id ? prev : [...prev.filter((i) => i !== id), id])
  }, [])
  const handleSharedFocus = useCallback((id: string) => {
    setSharedZOrder((prev) => prev[prev.length - 1] === id ? prev : [...prev.filter((i) => i !== id), id])
  }, [])

  const handleContentChange = useCallback((id: string, content: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, content } : n)))
    clearTimeout(contentTimers.current[id])
    contentTimers.current[id] = setTimeout(() => {
      fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      }).catch(() => {})
    }, 600)
  }, [])

  const handleColorChange = useCallback((id: string, color: NoteColor) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)))
    fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    }).catch(() => {})
  }, [])

  const handleDelete = useCallback((id: string) => {
    fetch(`/api/notes/${id}`, { method: "DELETE" }).catch(() => {})
    const el = document.getElementById(`note-${id}`)
    if (el) {
      gsap.to(el, {
        scale: 0.5, opacity: 0, duration: 0.22, ease: "power2.in",
        onComplete: () => {
          setNotes((prev) => prev.filter((n) => n.id !== id))
          setZOrder((prev) => prev.filter((i) => i !== id))
        },
      })
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== id))
      setZOrder((prev) => prev.filter((i) => i !== id))
    }
  }, [])

  const handlePinToggle = useCallback((id: string, pinned: boolean) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned } : n)))
    fetch(`/api/notes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    }).catch(() => {})
  }, [])

  const handleCreate = useCallback(async () => {
    const board = boardRef.current
    const cx = board ? board.scrollLeft + board.clientWidth / 2 - 110 : 200
    const cy = board ? board.scrollTop + board.clientHeight / 2 - 60 : 200
    const x = randomOffset(cx - 60, 120)
    const y = randomOffset(cy - 40, 80)

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    })
    if (!res.ok) return
    const note = await res.json()
    setNotes((prev) => [...prev, note])
    setZOrder((prev) => [...prev, note.id])
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(`note-${note.id}`)
        if (el) gsap.fromTo(el, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.7)" })
      })
    })
  }, [])

  // Share / unshare
  const handleShareClick = useCallback((noteId: string, currentCourseId: number | null) => {
    setShareModal({ noteId, currentCourseId })
  }, [])

  const handleShareConfirm = useCallback(async (noteId: string, course: Course | null) => {
    setShareModal(null)
    const body = course
      ? { shared: true, courseId: course.id, courseName: course.name }
      : { shared: false }

    await fetch(`/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {})

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? { ...n, ...(course
              ? { shared: true, courseId: course.id, courseName: course.name }
              : { shared: false, courseId: null, courseName: null }) }
          : n
      )
    )
  }, [])

  // Poll shared notes every 30s while on shared tab
  useEffect(() => {
    if (tab !== "shared") return
    const poll = setInterval(async () => {
      const res = await fetch("/api/notes/shared").catch(() => null)
      if (!res?.ok) return
      const data: SharedNote[] = await res.json()
      setSharedNotes((prev) => {
        const posMap = new Map(prev.map((n) => [n.id, { localX: n.localX, localY: n.localY }]))
        return data.map((note, i) => ({
          ...note,
          localX: posMap.get(note.id)?.localX ?? note.viewX ?? spreadPosition(i).x,
          localY: posMap.get(note.id)?.localY ?? note.viewY ?? spreadPosition(i).y,
        }))
      })
    }, 30_000)
    return () => clearInterval(poll)
  }, [tab])

  // Cleanup drag listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", onDocMove.current)
      document.removeEventListener("pointerup", onDocUp.current)
      document.removeEventListener("pointercancel", onDocUp.current)
    }
  }, [])

  const sharedCount = sharedNotes.length

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 4, padding: "8px 16px",
        borderBottom: "1px solid var(--b1)", background: "rgba(10,10,11,.6)", flexShrink: 0,
      }}>
        {(["mine", "shared"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "5px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer",
              fontFamily: "var(--sans)", border: "none",
              background: tab === t ? "var(--blue)" : "transparent",
              color: tab === t ? "#fff" : "var(--tx2)",
              fontWeight: tab === t ? 600 : 400,
              transition: "background .15s, color .15s",
            }}
          >
            {t === "mine" ? "Mis notas" : (
              <>Compartidas{sharedCount > 0 && (
                <span style={{
                  marginLeft: 6, background: "rgba(75,140,248,0.25)",
                  color: "var(--blue)", borderRadius: 10, padding: "1px 6px",
                  fontSize: 10, fontWeight: 700,
                }}>
                  {sharedCount}
                </span>
              )}</>
            )}
          </button>
        ))}
      </div>

      {/* Canvas area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div ref={boardRef} style={{ position: "absolute", inset: 0, overflow: "auto" }}>
          <div style={{
            position: "relative",
            width: "max(100%, 2400px)",
            height: "max(100%, 1600px)",
            background: CANVAS_BG,
          }}>

            {/* Personal notes canvas */}
            {tab === "mine" && (
              <>
                {notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onPointerDown={handlePointerDown}
                    onContentChange={handleContentChange}
                    onColorChange={handleColorChange}
                    onDelete={handleDelete}
                    onPinToggle={handlePinToggle}
                    onShareClick={handleShareClick}
                    zIndex={zOrder.indexOf(note.id) + 1}
                    onFocus={handleFocus}
                  />
                ))}
                {notes.length === 0 && <EmptyCanvas text="Sin notas — crea una con el botón +" />}
              </>
            )}

            {/* Shared notes canvas */}
            {tab === "shared" && (
              <>
                {sharedNotes.map((note) => (
                  <SharedNoteCard
                    key={note.id}
                    note={note}
                    onPointerDown={handleSharedPointerDown}
                    zIndex={sharedZOrder.indexOf(note.id) + 1}
                    onFocus={handleSharedFocus}
                  />
                ))}
                {sharedNotes.length === 0 && (
                  <EmptyCanvas text="Ningún compañero ha compartido notas contigo aún" />
                )}
              </>
            )}
          </div>
        </div>

        {/* FAB — solo en tab mine */}
        {tab === "mine" && (
          <button
            onClick={handleCreate}
            style={{
              position: "absolute", bottom: 24, right: 24,
              width: 48, height: 48, borderRadius: "50%",
              background: "var(--blue)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(75,140,248,0.4)",
              zIndex: 10000, transition: "transform .15s, box-shadow .15s",
              color: "#fff",
            }}
            title="Nueva nota"
            onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = "scale(1.1)"; el.style.boxShadow = "0 6px 28px rgba(75,140,248,0.55)" }}
            onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.transform = ""; el.style.boxShadow = "0 4px 20px rgba(75,140,248,0.4)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Share modal */}
      {shareModal && (
        <ShareModal
          noteId={shareModal.noteId}
          currentCourseId={shareModal.currentCourseId}
          courses={courses}
          onConfirm={handleShareConfirm}
          onCancel={() => setShareModal(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EmptyCanvas placeholder
// ---------------------------------------------------------------------------

function EmptyCanvas({ text }: { text: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8, pointerEvents: "none",
    }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ opacity: 0.15 }}>
        <rect x="4" y="4" width="32" height="32" rx="6" stroke="var(--tx)" strokeWidth="2"/>
        <path d="M12 14h16M12 20h12M12 26h8" stroke="var(--tx)" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--tx3)", textAlign: "center", maxWidth: 240 }}>
        {text}
      </p>
    </div>
  )
}
