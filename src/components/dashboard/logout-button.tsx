"use client"

import { signOut } from "next-auth/react"

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-2.5 w-full px-2 py-[7px] rounded-lg text-[12px] transition-colors"
      style={{
        fontFamily: "var(--mono)",
        color: "var(--tx2)",
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--s2)"; e.currentTarget.style.color = "var(--tx)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--tx2)" }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5M9.5 9.5L12 7l-2.5-2.5M5 7h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Cerrar sesión
    </button>
  )
}
