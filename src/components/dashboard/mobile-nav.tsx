"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { AddTaskModal } from "@/components/dashboard/add-task-modal"

const NAV_ITEMS_LEFT = [
  {
    href: "/dashboard",
    label: "Inicio",
    exact: true,
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/tareas",
    label: "Tareas",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const NAV_ITEMS_RIGHT = [
  {
    href: "/dashboard/horario",
    label: "Horario",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1 6h14" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <path d="M4 9h2M7 9h2M10 9h2M4 12h2M7 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Ajustes",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
]

function NavLink({ href, label, icon, exact }: { href: string; label: string; icon: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname()
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?")
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 transition-colors"
      style={{
        color: active ? "var(--blue)" : "var(--tx2)",
        textDecoration: "none",
        flex: 1,
        height: "100%",
        padding: "0 4px",
      }}
    >
      <span className="w-[22px] h-[22px]">{icon}</span>
      <span className="text-[9px] uppercase tracking-wider" style={{ fontFamily: "var(--mono)" }}>
        {label}
      </span>
    </Link>
  )
}

export function MobileBottomNav() {
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <>
      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}

      <nav
        className="md:hidden flex items-center shrink-0"
        style={{
          height: 60,
          borderTop: "1px solid var(--b1)",
          background: "var(--card)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Left items */}
        {NAV_ITEMS_LEFT.map(({ href, label, icon, exact }) => (
          <NavLink key={href} href={href} label={label} icon={icon} exact={exact} />
        ))}

        {/* Center FAB — agregar tarea manual */}
        <div className="flex items-center justify-center" style={{ flex: 1, height: "100%" }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: 44,
              height: 44,
              background: "var(--blue)",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 12px rgba(75,140,248,.4)",
            }}
            title="Nueva tarea manual"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 3v12M3 9h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Right items */}
        {NAV_ITEMS_RIGHT.map(({ href, label, icon }) => (
          <NavLink key={href} href={href} label={label} icon={icon} />
        ))}
      </nav>
    </>
  )
}
