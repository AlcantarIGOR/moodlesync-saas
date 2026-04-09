"use client"

import { useState, useEffect } from "react"

export function PushToggle() {
  const [status, setStatus] = useState<"loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed">("loading")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported")
      return
    }
    if (Notification.permission === "denied") {
      setStatus("denied")
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? "subscribed" : "unsubscribed")
    })
  }, [])

  async function handleEnable() {
    setSaving(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        setStatus("denied")
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      if (res.ok) setStatus("subscribed")
    } catch (err) {
      console.error("[push] subscribe error:", err)
    } finally {
      setSaving(false)
    }
  }

  async function handleDisable() {
    setSaving(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setStatus("unsubscribed")
    } catch (err) {
      console.error("[push] unsubscribe error:", err)
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="h-9 w-28 rounded-lg animate-pulse" style={{ background: "var(--s3)" }} />
    )
  }

  if (status === "unsupported") {
    return (
      <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
        No soportado en este navegador
      </span>
    )
  }

  if (status === "denied") {
    return (
      <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--red)" }}>
        Permiso denegado — habilita en ajustes del navegador
      </span>
    )
  }

  if (status === "subscribed") {
    return (
      <button
        onClick={handleDisable}
        disabled={saving}
        className="h-9 px-4 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
        style={{ background: "var(--red-d)", border: "1px solid var(--red-b)", color: "var(--red)", cursor: "pointer" }}
      >
        {saving ? "Desactivando…" : "Desactivar"}
      </button>
    )
  }

  return (
    <button
      onClick={handleEnable}
      disabled={saving}
      className="h-9 px-4 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-50"
      style={{ background: "var(--blue-d)", border: "1px solid var(--blue-b)", color: "var(--blue)", cursor: "pointer" }}
    >
      {saving ? "Activando…" : "Activar"}
    </button>
  )
}
