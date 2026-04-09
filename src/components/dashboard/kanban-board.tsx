"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Task, TaskStatus } from "@prisma/client"

const COLUMNS: { id: TaskStatus; label: string; dot: string }[] = [
  { id: "PENDING",  label: "Pendientes",  dot: "#f59e0b" },
  { id: "DONE",     label: "Entregadas",  dot: "#22c55e" },
  { id: "ARCHIVED", label: "Archivadas",  dot: "#6b6b6f" },
]

function fmtDate(date: Date | null): string {
  if (!date) return "Sin fecha"
  return new Date(date).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Walk the elements-from-point list and return the first TaskStatus found. */
function colFromPoint(x: number, y: number): TaskStatus | null {
  const els = document.elementsFromPoint(x, y)
  for (const el of els) {
    const col = (el as HTMLElement).dataset?.column as TaskStatus | undefined
    if (col) return col
  }
  return null
}

// ---------------------------------------------------------------------------
// KanbanCard
// ---------------------------------------------------------------------------

function KanbanCard({
  task,
  onPointerDown,
}: {
  task: Task
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void
}) {
  const overdue = task.status === "PENDING" && task.dueDate && new Date(task.dueDate) < new Date()

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, task.id)}
      className="rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all select-none touch-none"
      style={{
        background: "var(--s2)",
        border: "1px solid var(--b1)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--b2)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--b1)")}
    >
      <p
        className="text-xs font-medium leading-snug mb-2"
        style={{
          color: task.status === "DONE" ? "var(--tx2)" : "var(--tx)",
          textDecoration: task.status === "DONE" ? "line-through" : "none",
        }}
      >
        {task.title}
      </p>
      <div className="flex items-center justify-between gap-2">
        {task.courseName && (
          <span
            className="text-[9px] truncate"
            style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}
          >
            {task.courseName}
          </span>
        )}
        <span
          className="text-[9px] shrink-0 ml-auto"
          style={{ fontFamily: "var(--mono)", color: overdue ? "var(--red)" : "var(--tx2)" }}
        >
          {fmtDate(task.dueDate)}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// KanbanCol
// ---------------------------------------------------------------------------

function KanbanCol({
  col,
  tasks,
  isOver,
  onPointerDown,
}: {
  col: (typeof COLUMNS)[number]
  tasks: Task[]
  isOver: boolean
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>, id: string) => void
}) {
  return (
    <div
      data-column={col.id}
      className="flex flex-col rounded-2xl overflow-hidden min-h-[400px] transition-all"
      style={{
        background: "var(--card)",
        border: `1px solid ${isOver ? "var(--blue-b)" : "var(--b1)"}`,
        boxShadow: isOver ? "0 0 0 1px var(--blue-b)" : "none",
      }}
    >
      {/* Header — no data-column so it inherits from the parent wrapper */}
      <div
        className="flex items-center justify-between px-3.5 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--b1)" }}
      >
        <div
          className="flex items-center gap-2 text-xs font-semibold"
          style={{ color: "var(--tx)" }}
        >
          <div
            className="w-[7px] h-[7px] rounded-full shrink-0"
            style={{ background: col.dot }}
          />
          {col.label}
        </div>
        <span
          className="text-[10px] rounded-full px-2 py-0.5"
          style={{ fontFamily: "var(--mono)", background: "var(--s2)", color: "var(--tx2)" }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 flex flex-col gap-[7px] p-2.5 overflow-y-auto">
        {tasks.map((t) => (
          <KanbanCard key={t.id} task={t} onPointerDown={onPointerDown} />
        ))}
        {tasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p
              className="text-xs"
              style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}
            >
              Arrastra aquí
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Ghost element — lives on document.body during a drag
// ---------------------------------------------------------------------------

function createGhost(sourceEl: HTMLElement): HTMLDivElement {
  const rect = sourceEl.getBoundingClientRect()
  const ghost = sourceEl.cloneNode(true) as HTMLDivElement
  ghost.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    pointer-events: none;
    opacity: 0.85;
    transform: scale(1.03) rotate(1.5deg);
    z-index: 9999;
    border-radius: 0.75rem;
    box-shadow: 0 12px 32px rgba(0,0,0,0.25);
    transition: transform 0ms, box-shadow 0ms;
  `
  document.body.appendChild(ghost)
  return ghost
}

// ---------------------------------------------------------------------------
// KanbanBoard
// ---------------------------------------------------------------------------

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [overCol, setOverCol] = useState<TaskStatus | null>(null)

  // Drag state kept in refs so it never triggers re-renders mid-drag.
  // We also store a ref to tasks so the pointerup closure always sees
  // the latest snapshot without needing to re-register listeners.
  const draggingId   = useRef<string | null>(null)
  const ghostEl      = useRef<HTMLDivElement | null>(null)
  const offsetX      = useRef(0)
  const offsetY      = useRef(0)
  const tasksRef     = useRef(tasks)

  // Keep tasksRef in sync whenever tasks change
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  const byCol = (id: TaskStatus) =>
    tasks
      .filter((t) => t.status === id)
      .sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })

  // ------------------------------------------------------------------
  // Document-level pointer handlers (registered only while dragging)
  // ------------------------------------------------------------------
  //
  // Attaching move/up to document instead of a React container is the
  // correct cross-browser pattern for pointer-capture drag on mobile:
  //
  //   • setPointerCapture routes events to the capturing element, but
  //     that element may be unmounted / scrolled off-screen mid-drag.
  //   • Document listeners fire unconditionally for every pointer event,
  //     regardless of capture state or which element is underneath.
  //
  // We keep the handlers stable with useRef so addEventListener /
  // removeEventListener always receive the same function reference.

  const onDocMove = useRef<(e: PointerEvent) => void>(() => {})
  const onDocUp   = useRef<(e: PointerEvent) => void>(() => {})

  // Cleanup helper — removes ghost and document listeners
  const endDrag = useCallback(() => {
    document.removeEventListener("pointermove", onDocMove.current)
    document.removeEventListener("pointerup",   onDocUp.current)
    document.removeEventListener("pointercancel", onDocUp.current)
    if (ghostEl.current) {
      ghostEl.current.remove()
      ghostEl.current = null
    }
    draggingId.current = null
    setOverCol(null)
  }, [])

  // ------------------------------------------------------------------
  // Pointer down — start drag
  // ------------------------------------------------------------------
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, id: string) => {
      // Only primary pointer (left mouse / first touch)
      if (e.button !== 0 && e.pointerType === "mouse") return

      e.preventDefault()
      e.stopPropagation()

      draggingId.current = id

      const cardEl = e.currentTarget as HTMLDivElement
      const rect = cardEl.getBoundingClientRect()
      offsetX.current = e.clientX - rect.left
      offsetY.current = e.clientY - rect.top

      // Build ghost before releasing pointer capture so we can read the rect
      ghostEl.current = createGhost(cardEl)

      // Define and register document-level listeners.
      // We reassign the .current refs so endDrag always removes the same fns.

      onDocMove.current = (ev: PointerEvent) => {
        if (!ghostEl.current) return
        ghostEl.current.style.left = `${ev.clientX - offsetX.current}px`
        ghostEl.current.style.top  = `${ev.clientY - offsetY.current}px`

        // Hide ghost so elementsFromPoint sees what's underneath
        ghostEl.current.style.visibility = "hidden"
        const col = colFromPoint(ev.clientX, ev.clientY)
        ghostEl.current.style.visibility = ""

        setOverCol(col)
      }

      onDocUp.current = async (ev: PointerEvent) => {
        const dragId = draggingId.current
        if (!dragId) return

        // Hide ghost before hit-test so it isn't returned by elementsFromPoint
        if (ghostEl.current) ghostEl.current.style.visibility = "hidden"
        const targetCol = colFromPoint(ev.clientX, ev.clientY)

        endDrag()

        if (!targetCol) return

        const currentTasks = tasksRef.current
        const task = currentTasks.find((t) => t.id === dragId)
        if (!task || task.status === targetCol) return

        // Optimistic update
        setTasks((prev) => prev.map((t) => (t.id === dragId ? { ...t, status: targetCol } : t)))

        try {
          const res = await fetch(`/api/tasks/${dragId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: targetCol }),
          })
          if (!res.ok) throw new Error()
          router.refresh()
        } catch {
          // Rollback on failure
          setTasks((prev) =>
            prev.map((t) => (t.id === dragId ? { ...t, status: task.status } : t))
          )
        }
      }

      document.addEventListener("pointermove",   onDocMove.current)
      document.addEventListener("pointerup",     onDocUp.current)
      document.addEventListener("pointercancel", onDocUp.current)
    },
    [endDrag, router]
  )

  // Safety net: clean up if component unmounts mid-drag
  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", onDocMove.current)
      document.removeEventListener("pointerup",   onDocUp.current)
      document.removeEventListener("pointercancel", onDocUp.current)
      if (ghostEl.current) {
        ghostEl.current.remove()
        ghostEl.current = null
      }
    }
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {COLUMNS.map((col) => (
        <KanbanCol
          key={col.id}
          col={col}
          tasks={byCol(col.id)}
          isOver={overCol === col.id}
          onPointerDown={handlePointerDown}
        />
      ))}
    </div>
  )
}
