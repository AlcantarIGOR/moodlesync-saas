"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/toast"

export function SyncButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/sync", { method: "POST" })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = data?.error ? `Error: ${data.error}` : "Error al sincronizar"
        setMessage(msg)
        toast(msg, "error")
      } else {
        const msg = `${data.synced} tarea${data.synced !== 1 ? "s" : ""} sincronizada${data.synced !== 1 ? "s" : ""}`
        setMessage(msg)
        toast(msg, "success")
        router.refresh()
      }
    } catch {
      setMessage("Error de conexión")
    } finally {
      setLoading(false)
      setTimeout(() => setMessage(null), 4000)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {message && (
        <span className="text-xs" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
          {message}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-1.5 h-[34px] px-3.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50"
        style={{
          background: "var(--blue)",
          border: "none",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ animation: loading ? "spin .65s linear infinite" : "none" }}
        >
          <path d="M10 6A4 4 0 1 1 6 2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6 0l2 2-2 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {loading ? "Sincronizando..." : "Sincronizar"}
      </button>
    </div>
  )
}
