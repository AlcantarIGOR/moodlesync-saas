"use client"

import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const isLight = theme === "light"

  return (
    <button
      onClick={toggle}
      title={isLight ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "1px solid var(--b2)",
        background: "var(--s2)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--tx2)",
        flexShrink: 0,
        transition: "background .15s, color .15s, border .15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = "var(--s3)"
        el.style.color = "var(--tx)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.background = "var(--s2)"
        el.style.color = "var(--tx2)"
      }}
    >
      {isLight ? (
        /* Moon — currently light, click para dark */
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path
            d="M13.5 10.5A6 6 0 0 1 5.5 2.5a6 6 0 1 0 8 8z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        /* Sun — currently dark, click para light */
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/>
          <path
            d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}
