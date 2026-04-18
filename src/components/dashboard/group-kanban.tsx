"use client"

import { useState, useRef, useCallback, useEffect } from "react"

type TaskStatus = "PENDING" | "DONE" | "ARCHIVED"

export interface GroupTask {
  id: string
  userId: string
  groupId: string | null
  title: string
  courseName: string | null
  dueDate: string | null
  status: TaskStatus
  isManual: boolean
  user: { id: string; name: string }
}

export interface GroupMember {
  id: string
  userId: string
  role: "OWNER" | "MEMBER"
  user: { id: string; name: string; moodleUsername: string }
}

export interface GroupDetail {
  id: string
  name: string
  materia: string | null
  createdBy: string
  owner: { id: string; name: string; moodleUsername: string }
  members: GroupMember[]
  tasks: GroupTask[]
}

interface Props {
  group: GroupDetail
  currentUserId: string
}

const COLUMNS: { id: TaskStatus; label: string; dot: string }[] = [
  { id: "PENDING",  label: "Pendientes", dot: "#f59e0b" },
  { id: "DONE",     label: "Entregadas", dot: "#22c55e" },
  { id: "ARCHIVED", label: "Archivadas", dot: "#6b6b6f" },
]

function fmtDate(d: string | null) {
  if (!d) return "Sin fecha"
  return new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short" })
}

function colFromPoint(x: number, y: number): TaskStatus | null {
  const els = document.elementsFromPoint(x, y)
  for (const el of els) {
    const col = (el as HTMLElement).dataset?.column as TaskStatus | undefined
    if (col) return col
  }
  return null
}

export function GroupKanban({ group: initial, currentUserId }: Props) {
  const [tasks, setTasks] = useState<GroupTask[]>(initial.tasks)
  const [members, setMembers] = useState<GroupMember[]>(initial.members)
  const [showAddTask, setShowAddTask] = useState(false)
  const [showInvite, setShowInvite] = useState(false)

  // Polling every 15s to sync with other members
  useEffect(() => {
    const id = setInterval(async () => {
      const res = await fetch(`/api/groups/${initial.id}/tasks`)
      if (res.ok) setTasks(await res.json())
    }, 15_000)
    return () => clearInterval(id)
  }, [initial.id])

  // Drag state
  const draggingId = useRef<string | null>(null)
  const ghost = useRef<HTMLDivElement | null>(null)
  const offsetX = useRef(0)
  const offsetY = useRef(0)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>, id: string) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    draggingId.current = id

    const rect = e.currentTarget.getBoundingClientRect()
    offsetX.current = e.clientX - rect.left
    offsetY.current = e.clientY - rect.top

    const g = e.currentTarget.cloneNode(true) as HTMLDivElement
    g.style.cssText = `position:fixed;width:${rect.width}px;opacity:.85;pointer-events:none;z-index:9999;transform:scale(1.03) rotate(1.5deg);`
    g.style.left = `${e.clientX - offsetX.current}px`
    g.style.top  = `${e.clientY - offsetY.current}px`
    document.body.appendChild(g)
    ghost.current = g

    e.currentTarget.style.opacity = "0.3"
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!ghost.current) return
    ghost.current.style.left = `${e.clientX - offsetX.current}px`
    ghost.current.style.top  = `${e.clientY - offsetY.current}px`
  }, [])

  const onPointerUp = useCallback(async (e: React.PointerEvent<HTMLDivElement>, taskId: string, currentStatus: TaskStatus) => {
    e.currentTarget.style.opacity = ""
    ghost.current?.remove()
    ghost.current = null
    draggingId.current = null

    const newStatus = colFromPoint(e.clientX, e.clientY)
    if (!newStatus || newStatus === currentStatus) return

    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: newStatus } : t))

    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
  }, [])

  const isOwner = initial.createdBy === currentUserId

  function handleTaskAdded(t: GroupTask) {
    setTasks((prev) => [...prev, t])
    setShowAddTask(false)
  }

  function handleMemberAdded(m: GroupMember) {
    setMembers((prev) => [...prev, m])
    setShowInvite(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-5 py-3 shrink-0" style={{ borderBottom: "1px solid var(--b1)" }}>
        {/* Members strip */}
        <div className="flex items-center gap-1 flex-1">
          <div className="flex -space-x-1.5 mr-1">
            {members.slice(0, 6).map((m) => (
              <div key={m.userId} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ring-2"
                style={{ background: "var(--blue-d)", color: "var(--blue)", outline: "2px solid var(--bg)" }}
                title={m.user.name}>
                {m.user.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-[11px]" style={{ color: "var(--tx2)", fontFamily: "var(--mono)" }}>
            {members.length} miembro{members.length !== 1 ? "s" : ""}
          </span>
        </div>

        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] transition-all"
          style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Invitar
        </button>

        <button onClick={() => setShowAddTask(true)}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all"
          style={{ background: "var(--blue)", color: "#fff", border: "none", cursor: "pointer" }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Tarea
        </button>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full p-4 min-w-[560px]">
          {COLUMNS.map(({ id: colId, label, dot }) => {
            const colTasks = tasks.filter((t) => t.status === colId)
            return (
              <div
                key={colId}
                data-column={colId}
                className="flex flex-col flex-1 rounded-xl min-h-0"
                style={{ background: "var(--s1)", border: "1px solid var(--b1)" }}
              >
                {/* Column header */}
                <div className="flex items-center gap-2 px-3 py-2.5 shrink-0" style={{ borderBottom: "1px solid var(--b1)" }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                  <span className="text-[11px] font-semibold flex-1" style={{ color: "var(--tx)" }}>{label}</span>
                  <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>{colTasks.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colTasks.map((task) => {
                    const canDrag = task.userId === currentUserId
                    return (
                      <div
                        key={task.id}
                        onPointerDown={canDrag ? (e) => onPointerDown(e, task.id) : undefined}
                        onPointerMove={canDrag ? onPointerMove : undefined}
                        onPointerUp={canDrag ? (e) => onPointerUp(e, task.id, task.status) : undefined}
                        className="rounded-xl p-3 select-none touch-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--b1)",
                          cursor: canDrag ? "grab" : "default",
                        }}
                      >
                        <p className="text-xs font-medium leading-snug mb-1.5"
                          style={{
                            color: task.status === "DONE" ? "var(--tx2)" : "var(--tx)",
                            textDecoration: task.status === "DONE" ? "line-through" : "none",
                          }}>
                          {task.title}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] truncate" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                            {task.user.name}
                          </span>
                          <span className="text-[9px] shrink-0" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                            {fmtDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {colTasks.length === 0 && (
                    <div className="flex items-center justify-center py-8 text-[11px]"
                      style={{ color: "var(--tx2)", opacity: 0.5 }}>
                      vacío
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showAddTask && (
        <AddGroupTaskModal
          groupId={initial.id}
          materia={initial.materia}
          onClose={() => setShowAddTask(false)}
          onCreated={handleTaskAdded}
        />
      )}

      {showInvite && (
        <InviteMemberModal
          groupId={initial.id}
          onClose={() => setShowInvite(false)}
          onInvited={handleMemberAdded}
        />
      )}
    </div>
  )
}

// ── AddGroupTaskModal ────────────────────────────────────────────────────────

function AddGroupTaskModal({
  groupId,
  materia,
  onClose,
  onCreated,
}: {
  groupId: string
  materia: string | null
  onClose: () => void
  onCreated: (t: GroupTask) => void
}) {
  const [title, setTitle] = useState("")
  const [courseName, setCourseName] = useState(materia ?? "")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/groups/${groupId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), courseName: courseName.trim() || null, dueDate: dueDate || null }),
      })
      if (!res.ok) { setError("Error al crear la tarea"); return }
      onCreated(await res.json())
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-2xl animate-fadein"
        style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--b1)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--tx)" }}>Nueva tarea del grupo</p>
          <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] mb-1.5 uppercase tracking-[.08em]"
              style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Título <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Hacer el diagrama UML" required autoFocus
              className="w-full h-9 rounded-lg px-3 text-[13px] outline-none login-input"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx)" }} />
          </div>
          <div>
            <label className="block text-[10px] mb-1.5 uppercase tracking-[.08em]"
              style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Materia
            </label>
            <input value={courseName} onChange={(e) => setCourseName(e.target.value)}
              placeholder="Ej. POO"
              className="w-full h-9 rounded-lg px-3 text-[13px] outline-none login-input"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx)" }} />
          </div>
          <div>
            <label className="block text-[10px] mb-1.5 uppercase tracking-[.08em]"
              style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Fecha límite
            </label>
            <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-9 rounded-lg px-3 text-[12px] outline-none login-input"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)",
                color: dueDate ? "var(--tx)" : "var(--tx3)", fontFamily: "var(--mono)", colorScheme: "dark" }} />
          </div>
          {error && (
            <p className="text-[11px] px-3 py-2 rounded-lg"
              style={{ fontFamily: "var(--mono)", color: "var(--red)", background: "var(--red-d)", border: "1px solid var(--red-b)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs transition-all"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || !title.trim()}
              className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--blue)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", border: "none" }}>
              {loading ? "Creando..." : "Crear tarea"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── InviteMemberModal ────────────────────────────────────────────────────────

function InviteMemberModal({
  groupId,
  onClose,
  onInvited,
}: {
  groupId: string
  onClose: () => void
  onInvited: (m: GroupMember) => void
}) {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/groups/${groupId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moodleUsername: username.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al invitar"); return }
      onInvited(data)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-2xl animate-fadein"
        style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--b1)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--tx)" }}>Invitar compañero</p>
          <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1 1l7 7M8 1l-7 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] mb-1.5 uppercase tracking-[.08em]"
              style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Usuario Moodle <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. l21xxxxxxx" required autoFocus
              className="w-full h-9 rounded-lg px-3 text-[13px] outline-none login-input"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx)",
                fontFamily: "var(--mono)" }} />
            <p className="text-[10px] mt-1.5" style={{ color: "var(--tx2)" }}>
              El compañero ya debe haber iniciado sesión en MoodleSync al menos una vez.
            </p>
          </div>
          {error && (
            <p className="text-[11px] px-3 py-2 rounded-lg"
              style={{ fontFamily: "var(--mono)", color: "var(--red)", background: "var(--red-d)", border: "1px solid var(--red-b)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 h-9 rounded-lg text-xs transition-all"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || !username.trim()}
              className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--blue)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", border: "none" }}>
              {loading ? "Invitando..." : "Invitar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
