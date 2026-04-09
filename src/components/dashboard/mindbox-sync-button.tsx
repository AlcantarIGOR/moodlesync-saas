"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/lib/toast"

interface Props {
  hasCredentials: boolean
}

export function MindboxSyncButton({ hasCredentials }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSync() {
    if (!hasCredentials) {
      toast("Configura tu contraseña de Mindbox primero", "error")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/mindbox/sync", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(data?.error ?? "Error al sincronizar Mindbox", "error")
      } else {
        toast(`${data.synced} calificaciones sincronizadas`, "success")
        router.refresh()
      }
    } catch {
      toast("Error de conexión", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="flex items-center gap-1.5 h-[34px] px-3.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50"
      style={{
        background: "var(--s2)",
        border: "1px solid var(--b1)",
        color: "var(--tx)",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      <svg
        width="12" height="12" viewBox="0 0 12 12" fill="none"
        style={{ animation: loading ? "spin .65s linear infinite" : "none" }}
      >
        <path d="M10 6A4 4 0 1 1 6 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 0l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {loading ? "Sincronizando..." : "Sincronizar Mindbox"}
    </button>
  )
}
