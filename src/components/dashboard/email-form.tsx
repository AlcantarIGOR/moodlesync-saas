"use client"

import { useState } from "react"

export function EmailForm({ initial }: { initial: string | null }) {
  const [email, setEmail] = useState(initial ?? "")
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null)

  async function save() {
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) setMsg({ text: data.error ?? "Error al guardar", ok: false })
      else setMsg({ text: "Guardado", ok: true })
    } catch {
      setMsg({ text: "Error de conexión", ok: false })
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="flex-1 h-9 rounded-lg px-3 text-xs outline-none"
          style={{
            background: "var(--s2)",
            border: "1px solid var(--b1)",
            color: "var(--tx)",
            fontFamily: "var(--mono)",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--b1)")}
        />
        <button
          onClick={save}
          disabled={loading}
          className="h-9 px-4 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{
            background: "var(--blue-d)",
            border: "1px solid var(--blue-b)",
            color: "var(--blue)",
            cursor: "pointer",
          }}
        >
          {loading ? "..." : "Guardar"}
        </button>
      </div>
      {msg && (
        <p
          className="text-[11px]"
          style={{ fontFamily: "var(--mono)", color: msg.ok ? "var(--green)" : "var(--red)" }}
        >
          {msg.text}
        </p>
      )}
      <p className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
        Usamos este email para enviarte recordatorios antes de que venzan tus tareas.
      </p>
    </div>
  )
}
