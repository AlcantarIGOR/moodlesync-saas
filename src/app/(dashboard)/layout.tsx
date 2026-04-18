import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Suspense } from "react"
import { LogoutButton } from "@/components/dashboard/logout-button"
import { SidebarNav, SidebarSection } from "@/components/dashboard/sidebar-nav"
import { SemesterFilter } from "@/components/dashboard/semester-filter"
import { MobileBottomNav } from "@/components/dashboard/mobile-nav"
import { Toaster } from "@/components/dashboard/toaster"
import { CommandPalette } from "@/components/dashboard/command-palette"
import { OnboardingTour } from "@/components/dashboard/onboarding-tour"
import { DashboardMain } from "@/components/dashboard/dashboard-main"
import { ThemeToggle } from "@/components/theme-toggle"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  // Track last seen (fire-and-forget — no await so it doesn't slow the layout)
  void db.user.update({ where: { id: session.user.id }, data: { lastSeenAt: new Date() } }).catch(() => {})

  // Badges
  const tasks = await db.task.findMany({ where: { userId: session.user.id }, select: { status: true, dueDate: true } })
  const now = Date.now()
  // Urgentes: vence en los próximos 7 días (aún no pasado)
  const urgent  = tasks.filter((t) => t.status === "PENDING" && t.dueDate && new Date(t.dueDate).getTime() > now && new Date(t.dueDate).getTime() <= now + 7 * 86400000).length
  // Pendientes: vence en > 7 días (futuro, más allá de la ventana urgente) o sin fecha
  const pending = tasks.filter((t) => t.status === "PENDING" && (!t.dueDate || new Date(t.dueDate).getTime() > now + 7 * 86400000)).length
  const done    = tasks.filter((t) => t.status === "DONE").length
  const total   = tasks.filter((t) => t.status !== "ARCHIVED").length
  const archived = tasks.filter((t) => t.status === "ARCHIVED").length

  const initials = session.user.name?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "U"
  const username = session.user.name ?? "Usuario"

  const principalItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/></svg>,
    },
  ]

  const statusItems = [
    {
      href: "/dashboard/tareas",
      label: "Todas las tareas",
      badge: total,
      icon: <svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
    {
      href: "/dashboard/tareas?filter=urgentes",
      label: "Urgentes",
      badge: urgent,
      icon: <svg viewBox="0 0 16 16" fill="none"><path d="M8 2L2 13h12L8 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="M8 6v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
    {
      href: "/dashboard/tareas?filter=pendientes",
      label: "Pendientes",
      badge: pending,
      icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
    {
      href: "/dashboard/tareas?filter=completadas",
      label: "Completadas",
      badge: done,
      icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    },
  ]

  const viewItems = [
    {
      href: "/dashboard/kanban",
      label: "Kanban",
      icon: <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="6" y="3" width="4" height="7" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="11" y="3" width="4" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>,
    },
    {
      href: "/dashboard/horario",
      label: "Horario",
      icon: <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 6h14" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M4 9h2M7 9h2M10 9h2M4 12h2M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
    {
      href: "/dashboard/calendario",
      label: "Calendario",
      icon: <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 6h14" stroke="currentColor" strokeWidth="1.3"/><path d="M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="5" cy="10" r="1" fill="currentColor"/><circle cx="8" cy="10" r="1" fill="currentColor"/><circle cx="11" cy="10" r="1" fill="currentColor"/></svg>,
    },
    {
      href: "/dashboard/focus",
      label: "Modo Focus",
      icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>,
    },
    {
      href: "/dashboard/notas",
      label: "Notas",
      icon: <svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="9" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M11 4l2 2-5 5-2.5.5.5-2.5L11 4z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 6h4M5 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
    },
    {
      href: "/dashboard/grupos",
      label: "Grupos",
      icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 13c0-2.5 2.2-4 5-4M10 9c2.8 0 5 1.5 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M6 9c2.8 0 5 1.5 5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
    {
      href: "/dashboard/calificaciones",
      label: "Calificaciones",
      icon: <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5h8M4 8h6M4 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
    {
      href: "/dashboard/tareas?filter=archivadas",
      label: "Archivo",
      badge: archived,
      icon: <svg viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 7h14" stroke="currentColor" strokeWidth="1.3"/><path d="M6 2h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
  ]

  const isAdmin = session.user.id === process.env.ADMIN_USER_ID

  const systemItems = [
    {
      href: "/dashboard/settings",
      label: "Configuración",
      icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
    },
    ...(isAdmin ? [{
      href: "/dashboard/admin",
      label: "Admin",
      icon: <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><circle cx="13" cy="4" r="1.5" fill="currentColor"/><path d="M13 2v.5M13 5.5V6M11.2 2.8l.35.35M14.45 6.05l.35.35M10.5 4H11M15 4h.5M11.2 5.2l.35-.35M14.45 1.95l.35-.35" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>,
    }] : []),
  ]

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── SIDEBAR ── */}
      <aside className="hidden md:flex w-[224px] flex-col h-screen shrink-0"
        style={{ background: "var(--bg)", borderRight: "1px solid var(--b1)" }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 shrink-0" style={{ height: 54, borderBottom: "1px solid var(--b1)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--blue)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="2.5" fill="white"/>
              <circle cx="7" cy="7" r="5.5" stroke="white" strokeWidth="1.3"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight" style={{ color: "var(--tx)" }}>MoodleSync</div>
            <div className="text-[9px]" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>by ONYX Inc.</div>
          </div>
        </div>

        {/* Semester filter */}
        <div className="px-2 pt-2 pb-1" style={{ borderBottom: "1px solid var(--b1)" }}>
          <Suspense fallback={null}>
            <SemesterFilter />
          </Suspense>
        </div>

        {/* Nav body */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <SidebarSection label="Principal" />
          <Suspense fallback={null}>
            <SidebarNav items={principalItems} />
          </Suspense>

          <SidebarSection label="Por estado" />
          <Suspense fallback={null}>
            <SidebarNav items={statusItems} />
          </Suspense>

          <SidebarSection label="Vistas" />
          <Suspense fallback={null}>
            <SidebarNav items={viewItems} />
          </Suspense>

          <SidebarSection label="Sistema" />
          <Suspense fallback={null}>
            <SidebarNav items={systemItems} />
          </Suspense>
        </nav>

        {/* Footer: user + logout */}
        <div className="px-2 pb-2 shrink-0" style={{ borderTop: "1px solid var(--b1)" }}>
          <div className="flex items-center gap-2.5 px-2 py-2 mt-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-semibold"
              style={{ background: "var(--blue-d)", border: "1px solid var(--blue-b)", color: "var(--blue)", fontFamily: "var(--mono)" }}>
              {initials}
            </div>
            <span className="text-[11px] truncate flex-1" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              {username}
            </span>
            <ThemeToggle />
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        <DashboardMain>{children}</DashboardMain>

        {/* Mobile bottom nav */}
        <MobileBottomNav />
      </div>

      {/* Global overlays — fixed position, fuera del flujo */}
      <Toaster />
      <CommandPalette />
      <OnboardingTour userName={username} />
    </div>
  )
}
