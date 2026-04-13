"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
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
    href: "/dashboard/calificaciones",
    label: "Notas",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M4 5h8M4 8h6M4 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/dashboard/focus",
    label: "Focus",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
        <circle cx="8" cy="8" r="1" fill="currentColor"/>
      </svg>
    ),
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden flex items-center justify-around shrink-0"
      style={{
        height: 60,
        borderTop: "1px solid var(--b1)",
        background: "var(--card)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {NAV_ITEMS.map(({ href, label, icon, exact }) => {
        const active = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?")
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center gap-1 transition-colors"
            style={{
              color: active ? "var(--blue)" : "var(--tx2)",
              textDecoration: "none",
              minWidth: 56,
              height: "100%",
              padding: "0 4px",
            }}
          >
            <span className="w-[22px] h-[22px]">{icon}</span>
            <span
              className="text-[9px] uppercase tracking-wider"
              style={{ fontFamily: "var(--mono)" }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
