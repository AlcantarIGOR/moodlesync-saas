"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
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
    href: "/dashboard/calendario",
    label: "Cal.",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M1 6h14" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="5" cy="10" r="1" fill="currentColor"/>
        <circle cx="8" cy="10" r="1" fill="currentColor"/>
        <circle cx="11" cy="10" r="1" fill="currentColor"/>
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
  {
    href: "/dashboard/upgrade",
    label: "Premium",
    icon: (
      <svg viewBox="0 0 16 16" fill="none">
        <path d="M2 13l6-9 6 9H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden flex items-center justify-around h-16 shrink-0"
      style={{ borderTop: "1px solid var(--b1)", background: "var(--card)" }}
    >
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 p-2 transition-colors"
            style={{
              color: active ? "var(--blue)" : "var(--tx2)",
              textDecoration: "none",
            }}
          >
            <span className="w-5 h-5">{icon}</span>
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
