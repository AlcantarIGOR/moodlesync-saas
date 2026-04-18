import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { GroupKanban } from "@/components/dashboard/group-kanban"
import Link from "next/link"

export default async function GrupoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params
  const userId = session.user.id

  const group = await db.studyGroup.findFirst({
    where: {
      id,
      OR: [
        { createdBy: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, moodleUsername: true } },
      members: {
        include: { user: { select: { id: true, name: true, moodleUsername: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        where: { status: { not: "ARCHIVED" } },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { dueDate: "asc" },
      },
    },
  })

  if (!group) notFound()

  const serialized = {
    ...group,
    members: group.members.map((m: (typeof group.members)[number]) => ({ ...m, joinedAt: m.joinedAt.toISOString() })),
    tasks: group.tasks.map((t: (typeof group.tasks)[number]) => ({
      ...t,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  }

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div
        className="flex items-center gap-3 px-5 shrink-0"
        style={{
          height: 54,
          borderBottom: "1px solid var(--b1)",
          background: "var(--bg-glass)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Link
          href="/dashboard/grupos"
          className="flex items-center gap-1 text-[12px] transition-all"
          style={{ color: "var(--tx2)" }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3 6l4.5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Grupos
        </Link>
        <span style={{ color: "var(--b2)" }}>/</span>
        <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>
          {group.name}
        </span>
        {group.materia && (
          <span className="text-[11px]" style={{ color: "var(--tx2)", fontFamily: "var(--mono)" }}>
            — {group.materia}
          </span>
        )}
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-hidden">
        <GroupKanban group={serialized} currentUserId={userId} />
      </div>
    </div>
  )
}
