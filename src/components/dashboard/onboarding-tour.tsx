"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------

type TourStep = {
  id: string
  title: string
  desc: string
  selector: string | null   // null → centered card (no spotlight element)
  navigateTo: string | null // navigate before showing this step
  btnLabel: string
}

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Bienvenido a MoodleSync",
    desc: "__name__",
    selector: null,
    navigateTo: "/dashboard/tareas",
    btnLabel: "Comenzar el tour →",
  },
  {
    id: "tareas",
    title: "Todas tus tareas",
    desc: "Aquí se sincronizan todas tus entregas de Moodle automáticamente. Filtra por urgentes, pendientes o completadas.",
    selector: 'a[href="/dashboard/tareas"]',
    navigateTo: null,
    btnLabel: "Siguiente",
  },
  {
    id: "sync",
    title: "Botón de sincronizar",
    desc: "Tócalo para jalarte las tareas más recientes directo de Moodle. Úsalo cuando los profes suban una nueva entrega.",
    selector: '[data-tour="sync-btn"]',
    navigateTo: null,
    btnLabel: "Siguiente",
  },
  {
    id: "kanban",
    title: "Vista Kanban",
    desc: "Arrastra tus tareas entre Pendiente, Entregada y Archivada. Ideal para ver de un vistazo qué te falta.",
    selector: 'a[href="/dashboard/kanban"]',
    navigateTo: null,
    btnLabel: "Siguiente",
  },
  {
    id: "notas",
    title: "Tablero de Notas",
    desc: "Post-its que puedes mover libremente por el canvas. Anota recordatorios como \"estudiar para el parcial de cálculo\".",
    selector: 'a[href="/dashboard/notas"]',
    navigateTo: null,
    btnLabel: "Siguiente",
  },
  {
    id: "focus",
    title: "Modo Focus",
    desc: "Temporizador Pomodoro integrado. Selecciona una tarea, activa el focus y concéntrate 25 minutos sin distracciones.",
    selector: 'a[href="/dashboard/focus"]',
    navigateTo: null,
    btnLabel: "Siguiente",
  },
  {
    id: "email",
    title: "Recordatorios por email",
    desc: "Agrega tu correo y recibirás un aviso cada mañana cuando tengas entregas ese día. Se configura en segundos.",
    selector: '[data-tour="settings-email"]',
    navigateTo: "/dashboard/settings",
    btnLabel: "Siguiente",
  },
  {
    id: "push",
    title: "Notificaciones push",
    desc: "Activa las alertas en tu cel — te llegan aunque tengas la app cerrada, 24 horas antes de cada entrega.",
    selector: '[data-tour="settings-push"]',
    navigateTo: null,
    btnLabel: "Siguiente",
  },
  {
    id: "mindbox",
    title: "Calificaciones en Mindbox",
    desc: "Conecta tu cuenta de Mindbox para ver tus calificaciones directamente en MoodleSync, sin abrir otro sistema.",
    selector: '[data-tour="settings-mindbox"]',
    navigateTo: null,
    btnLabel: "Siguiente",
  },
  {
    id: "done",
    title: "¡Ya estás listo!",
    desc: "Tienes todo lo que necesitas. Empieza sincronizando tus tareas de Moodle y organiza tu semestre.",
    selector: null,
    navigateTo: "/dashboard/tareas",
    btnLabel: "Ir a mis tareas",
  },
]

const CONTENT_STEPS = 8   // steps 1–8 show progress dots
const STORAGE_KEY = "moodlesync_tour_v1"
const PAD = 10

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SpotRect = { left: number; top: number; width: number; height: number }

function cardSize(step: number) {
  const isLarge = step === 0 || step === STEPS.length - 1
  return { w: isLarge ? 340 : 300, h: isLarge ? 248 : 208 }
}

function computeTipPos(
  step: number,
  spot: SpotRect | null,
): { left: number; top: number; translateY: string } {
  const { w, h } = cardSize(step)

  if (!spot) {
    // Center of screen
    return {
      left: Math.max(16, (window.innerWidth  - w) / 2),
      top:  Math.max(16, (window.innerHeight - h) / 2),
      translateY: "0",
    }
  }

  const left = Math.max(8, Math.min(spot.left, window.innerWidth - w - 8))
  const spaceBelow = window.innerHeight - (spot.top + spot.height) - 12
  const below = spaceBelow >= h + 8

  return {
    left,
    top:       below ? spot.top + spot.height + 12 : spot.top - 12,
    translateY: below ? "0" : "-100%",
  }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function OnboardingTour({ userName }: { userName: string }) {
  const [visible, setVisible]   = useState(false)
  const [step, setStep]         = useState(0)
  const [spot, setSpot]         = useState<SpotRect | null>(null)
  // Tooltip position — always left/top so CSS can transition between them
  const [tipLeft, setTipLeft]   = useState(0)
  const [tipTop,  setTipTop]    = useState(0)
  const [tipTY,   setTipTY]     = useState("0")
  // Block transitions on very first render to avoid jumping from 0,0
  const firstRender = useRef(true)

  const pathname = usePathname()
  const router   = useRouter()

  // ── Show on first visit ──────────────────────────────────────────────────
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  // ── Find spotlight element & update position ─────────────────────────────
  useEffect(() => {
    if (!visible) return
    const s = STEPS[step]

    // No selector → clear spot (centered modal) right away
    if (!s.selector) {
      setSpot(null)
      return
    }

    let cancelled = false
    const t1 = setTimeout(() => {
      if (cancelled) return
      const el = document.querySelector<HTMLElement>(s.selector!)
      if (!el) { setSpot(null); return }

      el.scrollIntoView({ behavior: "smooth", block: "center" })

      const t2 = setTimeout(() => {
        if (cancelled) return
        const r = el.getBoundingClientRect()
        setSpot({ left: r.left - PAD, top: r.top - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
      }, 360)
      return () => clearTimeout(t2)
    }, 440)

    return () => { cancelled = true; clearTimeout(t1) }
  }, [step, pathname, visible])

  // ── Sync tooltip position whenever spot or step changes ──────────────────
  useEffect(() => {
    if (!visible) return
    const pos = computeTipPos(step, spot)

    if (firstRender.current) {
      // Skip transition on very first position set
      firstRender.current = false
      setTipLeft(pos.left)
      setTipTop(pos.top)
      setTipTY(pos.translateY)
      return
    }
    setTipLeft(pos.left)
    setTipTop(pos.top)
    setTipTY(pos.translateY)
  }, [spot, step, visible])

  // ── Recalculate on resize ─────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return
    const handler = () => {
      const pos = computeTipPos(step, spot)
      setTipLeft(pos.left)
      setTipTop(pos.top)
      setTipTY(pos.translateY)
    }
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [visible, step, spot])

  // ── Escape → skip ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") markDone() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

  const markDone = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisible(false)
  }, [])

  function handleBtn() {
    if (step === STEPS.length - 1) {
      const s = STEPS[step]
      if (s.navigateTo) router.push(s.navigateTo)
      markDone()
      return
    }

    const next = step + 1
    const nextStep = STEPS[next]
    if (nextStep.navigateTo) router.push(nextStep.navigateTo)
    setSpot(null)   // clear spotlight while navigating / finding next element
    setStep(next)
  }

  if (!visible) return null

  const s = STEPS[step]
  const hasSpot = !!spot && !!s.selector
  const contentStepNum = step >= 1 && step <= 8 ? step : null

  return (
    <>
      {/* ── Backdrop ──────────────────────────────────────────────────────── */}
      {hasSpot ? (
        // Spotlight hole via box-shadow + glowing border
        <div
          style={{
            position: "fixed",
            left: spot!.left,
            top:  spot!.top,
            width: spot!.width,
            height: spot!.height,
            borderRadius: 14,
            pointerEvents: "none",
            zIndex: 10000,
            // Outer shadow = dark overlay; inner shadows = blue glow
            boxShadow: [
              "0 0 0 9999px rgba(0,0,0,0.78)",
              "0 0 0 2px var(--blue)",
              "0 0 22px rgba(75,140,248,0.65)",
            ].join(", "),
            animation: "tour-pulse 2.4s ease-in-out infinite",
            transition: "left .32s cubic-bezier(.4,0,.2,1), top .32s cubic-bezier(.4,0,.2,1), width .32s cubic-bezier(.4,0,.2,1), height .32s cubic-bezier(.4,0,.2,1)",
          }}
        />
      ) : (
        // Full dark overlay (welcome / done / element not found)
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.78)",
            zIndex: 10000, pointerEvents: "none",
            transition: "opacity .2s ease",
          }}
        />
      )}

      {/* ── Tooltip card ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          left: tipLeft,
          top:  tipTop,
          transform: `translateY(${tipTY})`,
          zIndex: 10001,
          // Smooth slide between positions
          transition: [
            "left .36s cubic-bezier(.4,0,.2,1)",
            "top  .36s cubic-bezier(.4,0,.2,1)",
            "transform .36s cubic-bezier(.4,0,.2,1)",
          ].join(", "),
        }}
      >
        {/* key={step} → re-mounts TourCard on every step = triggers tour-in animation */}
        <TourCard
          key={step}
          step={s}
          stepNum={contentStepNum}
          total={CONTENT_STEPS}
          userName={userName}
          onSkip={markDone}
          onBtn={handleBtn}
          isWelcome={step === 0}
          isDone={step === STEPS.length - 1}
        />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// TourCard
// ---------------------------------------------------------------------------

function TourCard({
  step, stepNum, total, userName, onSkip, onBtn, isWelcome, isDone,
}: {
  step: TourStep
  stepNum: number | null
  total: number
  userName: string
  onSkip: () => void
  onBtn: () => void
  isWelcome: boolean
  isDone: boolean
}) {
  const firstName = userName.split(" ")[0]
  const desc = isWelcome
    ? `Hola ${firstName} 👋 Te damos un tour rápido para que saques el máximo provecho desde el primer día.`
    : step.desc

  const large = isWelcome || isDone

  return (
    <div
      style={{
        background: "var(--card)",
        border: "1px solid var(--b2)",
        borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(75,140,248,0.12)",
        padding: large ? "28px 28px 24px" : "18px 18px 16px",
        width: large ? 340 : 300,
        // Fade + rise animation on every step change (re-mount via key={step})
        animation: "tour-in .22s cubic-bezier(.4,0,.2,1) both",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          {stepNum !== null && (
            <p style={{
              fontFamily: "var(--mono)", fontSize: 10,
              color: "var(--blue)", marginBottom: 5, letterSpacing: ".08em",
            }}>
              {stepNum} / {total}
            </p>
          )}
          <p style={{ fontSize: large ? 17 : 14, fontWeight: 600, color: "var(--tx)", lineHeight: 1.3 }}>
            {step.title}
          </p>
        </div>

        <button
          onClick={onSkip}
          style={{
            background: "none", border: "none",
            color: "var(--tx3)", cursor: "pointer",
            padding: "2px 6px", fontSize: 11,
            fontFamily: "var(--mono)", marginLeft: 12,
            borderRadius: 4, flexShrink: 0,
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--tx2)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--tx3)")}
        >
          Saltar
        </button>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: "var(--tx2)", lineHeight: 1.6, marginBottom: 16 }}>
        {desc}
      </p>

      {/* Progress dots */}
      {stepNum !== null && (
        <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              height: 5, borderRadius: 3,
              width: i === stepNum - 1 ? 18 : 5,
              background: i === stepNum - 1 ? "var(--blue)" : "var(--s4)",
              transition: "width .22s ease, background .22s ease",
            }} />
          ))}
        </div>
      )}

      {/* Action button */}
      <button
        onClick={onBtn}
        style={{
          width: "100%", height: 38, borderRadius: 10,
          background: "var(--blue)", border: "none",
          color: "#fff", fontSize: 13, fontWeight: 600,
          cursor: "pointer", transition: "opacity .15s",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
      >
        {step.btnLabel}
      </button>
    </div>
  )
}
