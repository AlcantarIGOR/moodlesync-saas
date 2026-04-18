"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: "OWNER" | "MEMBER"
  joinedAt: string
  user: { id: string; name: string; moodleUsername: string }
}

export interface StudyGroup {
  id: string
  name: string
  materia: string | null
  createdBy: string
  createdAt: string
  owner: { id: string; name: string; moodleUsername: string }
  members: GroupMember[]
  _count: { tasks: number }
}

interface Props {
  initialGroups: StudyGroup[]
  currentUserId: string
}

export function GroupsBoard({ initialGroups, currentUserId }: Props) {
  const router = useRouter()
  const [groups, setGroups] = useState(initialGroups)
  const [showCreate, setShowCreate] = useState(false)

  function handleCreated(g: StudyGroup) {
    setGroups((prev) => [g, ...prev])
    setShowCreate(false)
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
            {groups.length} grupo{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-semibold transition-all"
          style={{ background: "var(--blue)", color: "#fff", border: "none", cursor: "pointer" }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
          Nuevo grupo
        </button>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl"
          style={{ border: "1px dashed var(--b1)", color: "var(--tx2)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-40">
            <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="15" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 18c0-3 2.7-5 6-5M15 13c3.3 0 6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M9 13c3.3 0 6 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-[13px]">Crea un grupo de estudio</p>
          <p className="text-[11px] mt-1 opacity-60">Comparte tareas con tus compañeros</p>
        </div>
      )}

      {/* Groups grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <GroupCard
            key={g.id}
            group={g}
            currentUserId={currentUserId}
            onDeleted={() => setGroups((prev) => prev.filter((x) => x.id !== g.id))}
            onOpen={() => router.push(`/dashboard/grupos/${g.id}`)}
          />
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}

// ── GroupCard ────────────────────────────────────────────────────────────────

function GroupCard({
  group,
  currentUserId,
  onDeleted,
  onOpen,
}: {
  group: StudyGroup
  currentUserId: string
  onDeleted: () => void
  onOpen: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const isOwner = group.createdBy === currentUserId

  async function handleLeaveOrDelete() {
    if (isOwner) {
      if (!confirm(`¿Eliminar el grupo "${group.name}"? Se borrarán todas sus tareas.`)) return
      setDeleting(true)
      await fetch(`/api/groups/${group.id}`, { method: "DELETE" })
    } else {
      if (!confirm(`¿Salir del grupo "${group.name}"?`)) return
      setDeleting(true)
      await fetch(`/api/groups/${group.id}/members/${currentUserId}`, { method: "DELETE" })
    }
    onDeleted()
  }

  const memberCount = group.members.length

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all"
      style={{ background: "var(--card)", border: "1px solid var(--b1)" }}
      onClick={onOpen}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold truncate" style={{ color: "var(--tx)" }}>
            {group.name}
          </p>
          {group.materia && (
            <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--tx2)" }}>
              {group.materia}
            </p>
          )}
        </div>
        {/* Leave/Delete button */}
        <button
          disabled={deleting}
          onClick={(e) => { e.stopPropagation(); handleLeaveOrDelete() }}
          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-all"
          style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
          title={isOwner ? "Eliminar grupo" : "Salir del grupo"}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1l6 6M7 1l-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="9" cy="4" r="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M1 10c0-2 1.8-3 4-3M8 7c2.2 0 4 1 4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {memberCount}
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M3 5h6M3 7.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {group._count.tasks} tareas
        </span>
        {isOwner && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--blue-d)", color: "var(--blue)", fontFamily: "var(--mono)" }}>
            dueño
          </span>
        )}
      </div>

      {/* Member avatars */}
      <div className="flex -space-x-1.5">
        {group.members.slice(0, 5).map((m) => (
          <div
            key={m.userId}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ring-2"
            style={{ background: "var(--blue-d)", color: "var(--blue)", outline: "2px solid var(--card)" }}
            title={m.user.name}
          >
            {m.user.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {group.members.length > 5 && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px]"
            style={{ background: "var(--s2)", color: "var(--tx2)", border: "2px solid var(--card)" }}>
            +{group.members.length - 5}
          </div>
        )}
      </div>
    </div>
  )
}

// ── CreateGroupModal ─────────────────────────────────────────────────────────

function CreateGroupModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (g: StudyGroup) => void
}) {
  const [name, setName] = useState("")
  const [materia, setMateria] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), materia: materia.trim() || null }),
      })
      if (!res.ok) { setError("Error al crear el grupo"); return }
      const g = await res.json()
      onCreated(g)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm rounded-2xl animate-fadein"
        style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--b1)" }}>
          <p className="text-[13px] font-semibold" style={{ color: "var(--tx)" }}>Nuevo grupo de estudio</p>
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
              Nombre <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Equipo Proyecto POO" required autoFocus
              className="w-full h-9 rounded-lg px-3 text-[13px] outline-none login-input"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx)" }} />
          </div>
          <div>
            <label className="block text-[10px] mb-1.5 uppercase tracking-[.08em]"
              style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Materia <span style={{ color: "var(--tx3)" }}>(opcional)</span>
            </label>
            <input value={materia} onChange={(e) => setMateria(e.target.value)}
              placeholder="Ej. Programación Orientada a Objetos"
              className="w-full h-9 rounded-lg px-3 text-[13px] outline-none login-input"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx)" }} />
          </div>
          {error && (
            <p className="text-[11px] px-3 py-2 rounded-lg"
              style={{ fontFamily: "var(--mono)", color: "var(--red)", background: "var(--red-d)", border: "1px solid var(--red-b)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-9 rounded-lg text-xs transition-all"
              style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || !name.trim()}
              className="flex-1 h-9 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{ background: "var(--blue)", color: "#fff", cursor: loading ? "not-allowed" : "pointer", border: "none" }}>
              {loading ? "Creando..." : "Crear grupo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
