import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { GroupsBoard } from "@/components/dashboard/groups-board"

export default async function GruposPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const groups = await db.studyGroup.findMany({
    where: {
      OR: [
        { createdBy: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, moodleUsername: true } },
      members: {
        include: { user: { select: { id: true, name: true, moodleUsername: true } } },
      },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const serialized = groups.map((g) => ({
    ...g,
    createdAt: g.createdAt.toISOString(),
    members: g.members.map((m: (typeof g.members)[number]) => ({ ...m, joinedAt: m.joinedAt.toISOString() })),
  }))

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-3 px-5 shrink-0"
        style={{
          height: 54,
          borderBottom: "1px solid var(--b1)",
          background: "var(--bg-glass)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>
          Grupos de estudio
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <GroupsBoard initialGroups={serialized} currentUserId={userId} />
      </div>
    </div>
  )
}
