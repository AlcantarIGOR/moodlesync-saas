"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import type { Note } from "@prisma/client"
import gsap from "gsap"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NoteColor = "yellow" | "blue" | "green" | "pink" | "purple"

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
  zIndex,
  onFocus,
}: {
  note: Note
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void
  onContentChange: (id: string, content: string) => void
  onColorChange: (id: string, color: NoteColor) => void
  onDelete: (id: string) => void
  onPinToggle: (id: string, pinned: boolean) => void
  zIndex: number
  onFocus: (id: string) => void
}) {
  const color = COLORS[(note.color as NoteColor) ?? "yellow"] ?? COLORS.yellow
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
  userId,
}: {
  initialNotes: Note[]
  userId: string
}) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [zOrder, setZOrder] = useState<string[]>(() => initialNotes.map((n) => n.id))

  const boardRef = useRef<HTMLDivElement>(null)
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const contentTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Drag state
  const draggingId = useRef<string | null>(null)
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
    (e: React.PointerEvent<HTMLDivElement>, id: string) => {
      if (e.button !== 0 && e.pointerType === "mouse") return
      e.preventDefault()
      e.stopPropagation()

      const noteEl = document.getElementById(`note-${id}`)
      if (!noteEl) return

      draggingId.current = id
      dragNodeRef.current = noteEl

      const rect = noteEl.getBoundingClientRect()
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

      document.addEventListener("pointermove", onDocMove.current)
      document.addEventListener("pointerup", onDocUp.current)
      document.addEventListener("pointercancel", onDocUp.current)
    },
    [endDrag]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string) => startDrag(e, id),
    [startDrag]
  )

  const handleFocus = useCallback((id: string) => {
    setZOrder((prev) => prev[prev.length - 1] === id ? prev : [...prev.filter((i) => i !== id), id])
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

  // Cleanup drag listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", onDocMove.current)
      document.removeEventListener("pointerup", onDocUp.current)
      document.removeEventListener("pointercancel", onDocUp.current)
    }
  }, [])

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Canvas area */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <div ref={boardRef} style={{ position: "absolute", inset: 0, overflow: "auto" }}>
          <div style={{
            position: "relative",
            width: "max(100%, 2400px)",
            height: "max(100%, 1600px)",
            background: CANVAS_BG,
          }}>
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onPointerDown={handlePointerDown}
                onContentChange={handleContentChange}
                onColorChange={handleColorChange}
                onDelete={handleDelete}
                onPinToggle={handlePinToggle}
                zIndex={zOrder.indexOf(note.id) + 1}
                onFocus={handleFocus}
              />
            ))}
            {notes.length === 0 && <EmptyCanvas text="Sin notas — crea una con el botón +" />}
          </div>
        </div>

        {/* FAB */}
        <button
          onClick={handleCreate}
          style={{
            position: "absolute", bottom: 24, right: 24,
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--blue)", border: "none", cursor: "pointer",
            display: "flex",
            alignItems: "center", justifyContent: "center",
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
      </div>
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
