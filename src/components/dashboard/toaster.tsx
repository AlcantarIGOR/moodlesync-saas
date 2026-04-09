"use client"

import { useState, useEffect, useCallback } from "react"
import type { ToastType } from "@/lib/toast"

interface ToastItem {
  id: number
  message: string
  type: ToastType
  visible: boolean
}

const COLORS: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
  success: { bg: "var(--green-d)",  border: "var(--green-b)",  color: "var(--green)",  icon: "✓" },
  error:   { bg: "var(--red-d)",    border: "var(--red-b)",    color: "var(--red)",    icon: "✕" },
  info:    { bg: "var(--blue-d)",   border: "var(--blue-b)",   color: "var(--blue)",   icon: "·" },
}

let counter = 0

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: false } : t))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 300)
  }, [])

  useEffect(() => {
    function handler(e: Event) {
      const { message, type } = (e as CustomEvent).detail as { message: string; type: ToastType }
      const id = ++counter
      setToasts((prev) => [...prev, { id, message, type, visible: false }])
      // Trigger enter animation next tick
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setToasts((prev) => prev.map((t) => t.id === id ? { ...t, visible: true } : t))
        )
      )
      setTimeout(() => dismiss(id), 2500)
    }
    window.addEventListener("moodlesync:toast", handler)
    return () => window.removeEventListener("moodlesync:toast", handler)
  }, [dismiss])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => {
        const c = COLORS[t.type]
        return (
          <div
            key={t.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--card)",
              border: `1px solid ${c.border}`,
              boxShadow: "0 4px 16px rgba(0,0,0,.3)",
              fontFamily: "var(--mono)",
              fontSize: 12,
              color: "var(--tx)",
              transform: t.visible ? "translateY(0)" : "translateY(12px)",
              opacity: t.visible ? 1 : 0,
              transition: "transform .2s ease, opacity .2s ease",
              pointerEvents: "auto",
              minWidth: 200,
              maxWidth: 320,
            }}
          >
            <span style={{ fontWeight: 700, color: c.color, fontSize: 13 }}>{c.icon}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            <div style={{ width: 3, height: 24, borderRadius: 2, background: c.color, opacity: 0.6, flexShrink: 0 }} />
          </div>
        )
      })}
    </div>
  )
}
