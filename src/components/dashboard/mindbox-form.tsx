"use client"

import { useState } from "react"
import { toast } from "@/lib/toast"

interface Props {
  hasSaved: boolean
}

export function MindboxForm({ hasSaved }: Props) {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  async function save() {
    if (!password) return
    setLoading(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mindboxPassword: password }),
      })
      if (res.ok) {
        toast("Contraseña de Mindbox guardada", "success")
        setPassword("")
      } else {
        toast("Error al guardar", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
        Ingresa tu contraseña de Mindbox para sincronizar tus calificaciones.
        Tu número de control se usa automáticamente.
      </p>

      {hasSaved && (
        <div className="flex items-center gap-1.5 text-[10px] rounded px-2 py-1"
          style={{ fontFamily: "var(--mono)", color: "var(--green)", background: "var(--green-d)", border: "1px solid var(--green-b)", width: "fit-content" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <circle cx="5" cy="5" r="4.5" stroke="currentColor" strokeWidth="1"/>
            <path d="M3 5l1.5 1.5L7 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Contraseña guardada
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            placeholder={hasSaved ? "Nueva contraseña (dejar vacío = mantener)" : "Contraseña Mindbox"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="w-full h-9 px-3 pr-9 rounded-lg text-[12px] outline-none"
            style={{
              background: "var(--s2)",
              border: "1px solid var(--b1)",
              color: "var(--tx)",
              fontFamily: "var(--mono)",
            }}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--tx2)" }}
          >
            {show ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M5.5 4.5A3 3 0 0112 7c-.5.8-1.1 1.5-1.8 2M2 7c.5-.8 1.1-1.5 1.8-2M7 4a3 3 0 012.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 3C4.5 3 2.3 4.6 1 7c1.3 2.4 3.5 4 6 4s4.7-1.6 6-4c-1.3-2.4-3.5-4-6-4z" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            )}
          </button>
        </div>
        <button
          onClick={save}
          disabled={loading || !password}
          className="h-9 px-4 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{ background: "var(--blue)", border: "none", color: "#fff", cursor: "pointer" }}
        >
          {loading ? "..." : "Guardar"}
        </button>
      </div>
    </div>
  )
}
