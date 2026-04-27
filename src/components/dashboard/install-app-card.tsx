"use client"

import { useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

type Platform = "android" | "ios" | "desktop" | "unsupported"

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unsupported"
  const ua = navigator.userAgent
  // iOS detection (incl. iPadOS reporting as Mac)
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  if (isIOS) return "ios"
  if (/Android/i.test(ua)) return "android"
  return "desktop"
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS
    (window.navigator as { standalone?: boolean }).standalone === true
  )
}

export function InstallAppCard() {
  const [installed, setInstalled] = useState(false)
  const [platform, setPlatform] = useState<Platform>("unsupported")
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installing, setInstalling] = useState(false)
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setPlatform(detectPlatform())
    setInstalled(isStandalone())

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  // Avoid SSR/CSR mismatch and hide entirely if installed
  if (!mounted || installed) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === "accepted") setInstalled(true)
      setDeferredPrompt(null)
    } finally {
      setInstalling(false)
    }
  }

  const canPromptNative = !!deferredPrompt
  const isIos = platform === "ios"
  // Hide on desktop without installable prompt (no actionable guidance)
  if (!canPromptNative && !isIos && platform === "desktop") return null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--blue-b)" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--b1)", background: "var(--blue-d)" }}>
        <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>
          Instalar app
        </p>
        <span className="text-[9px] rounded px-1.5 py-0.5 font-semibold"
          style={{ fontFamily: "var(--mono)", background: "var(--blue-d)", color: "var(--blue)", border: "1px solid var(--blue-b)" }}>
          PWA
        </span>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--blue-d)", border: "1px solid var(--blue-b)" }}>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="2" y="2" width="12" height="12" rx="2.5" stroke="var(--blue)" strokeWidth="1.3"/>
              <path d="M8 5v5M5.5 7.5L8 10l2.5-2.5" stroke="var(--blue)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--tx)" }}>
              MoodleSync en tu pantalla de inicio
            </p>
            <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Acceso rápido sin abrir el navegador y notificaciones push nativas.
            </p>
          </div>
        </div>

        {/* Android / Chrome / Edge: native prompt */}
        {canPromptNative && (
          <button
            onClick={handleInstall}
            disabled={installing}
            aria-label="Instalar MoodleSync en este dispositivo"
            className="w-full h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-opacity"
            style={{
              background: "var(--blue)",
              color: "white",
              border: "none",
              cursor: installing ? "not-allowed" : "pointer",
              opacity: installing ? 0.6 : 1,
              fontFamily: "var(--mono)",
            }}
          >
            {installing ? (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ animation: "spin 1s linear infinite" }}>
                  <circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3"/>
                  <path d="M14 8a6 6 0 0 0-6-6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Instalando…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M8 2v8M5 7l3 3 3-3M2 13h12" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Instalar MoodleSync
              </>
            )}
          </button>
        )}

        {/* iOS Safari: manual instructions (no API available) */}
        {isIos && !canPromptNative && (
          <>
            <button
              onClick={() => setShowIosHelp((v) => !v)}
              aria-expanded={showIosHelp}
              aria-controls="ios-install-steps"
              className="w-full h-10 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2"
              style={{
                background: "var(--blue-d)",
                color: "var(--blue)",
                border: "1px solid var(--blue-b)",
                cursor: "pointer",
                fontFamily: "var(--mono)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2v7M5.5 4.5L8 2l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 9v3.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              {showIosHelp ? "Ocultar instrucciones" : "Cómo instalar en iPhone"}
            </button>

            {showIosHelp && (
              <ol id="ios-install-steps" className="space-y-2 pl-1" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                <li className="flex gap-2 text-[11px]">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={{ background: "var(--blue-d)", color: "var(--blue)", border: "1px solid var(--blue-b)" }}>
                    1
                  </span>
                  <span>Abre esta página en <strong style={{ color: "var(--tx)" }}>Safari</strong> (no en Chrome ni la app de Instagram).</span>
                </li>
                <li className="flex gap-2 text-[11px]">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={{ background: "var(--blue-d)", color: "var(--blue)", border: "1px solid var(--blue-b)" }}>
                    2
                  </span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    Toca el botón
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ background: "var(--s2)", border: "1px solid var(--b1)" }}>
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M8 2v7M5.5 4.5L8 2l2.5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 9v3.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                    </span>
                    <strong style={{ color: "var(--tx)" }}>Compartir</strong> en la barra inferior.
                  </span>
                </li>
                <li className="flex gap-2 text-[11px]">
                  <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold"
                    style={{ background: "var(--blue-d)", color: "var(--blue)", border: "1px solid var(--blue-b)" }}>
                    3
                  </span>
                  <span>Elige <strong style={{ color: "var(--tx)" }}>Añadir a pantalla de inicio</strong> y confirma.</span>
                </li>
              </ol>
            )}
          </>
        )}

        {/* Android without prompt yet (rare — usually fires within seconds) */}
        {!canPromptNative && platform === "android" && (
          <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
            Si no aparece el botón de instalar, abre el menú <strong style={{ color: "var(--tx)" }}>⋮</strong> de Chrome y elige
            <strong style={{ color: "var(--tx)" }}> Instalar app</strong> o <strong style={{ color: "var(--tx)" }}>Añadir a pantalla de inicio</strong>.
          </p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
