import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { NotesBoard } from "@/components/dashboard/notes-board"

export default async function NotasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const notes = await db.note.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  })

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
        <span
          className="text-[15px] font-semibold"
          style={{ color: "var(--tx)", letterSpacing: "-.3px" }}
        >
          Notas
        </span>
        <span
          className="text-[11px]"
          style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}
        >
          — arrastra para mover
        </span>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <NotesBoard
          initialNotes={notes}
          userId={userId}
        />
      </div>
    </div>
  )
}
