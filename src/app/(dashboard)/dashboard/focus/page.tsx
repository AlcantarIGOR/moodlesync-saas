import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { FocusTimer } from "@/components/dashboard/focus-timer"

export default async function FocusPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center gap-3 px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "var(--bg-glass)", backdropFilter: "blur(10px)" }}>
        <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>Modo Focus</span>
        <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>— Pomodoro</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <FocusTimer />
      </div>
    </div>
  )
}
