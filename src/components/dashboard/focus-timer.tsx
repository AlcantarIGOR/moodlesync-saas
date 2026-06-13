"use client"

import { useState, useEffect, useRef, useCallback } from "react"

type Mode = "focus" | "short" | "long"
type TaskOption = { id: string; title: string; courseName: string | null; status: string }

const DURATIONS: Record<Mode, number> = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
}

const MODE_LABELS: Record<Mode, string> = {
  focus: "Enfoque",
  short: "Descanso corto",
  long: "Descanso largo",
}

const MODE_COLORS: Record<Mode, string> = {
  focus: "var(--blue)",
  short: "var(--green)",
  long: "var(--amber)",
}

function pad(n: number) { return String(n).padStart(2, "0") }

function formatTime(secs: number) {
  return `${pad(Math.floor(secs / 60))}:${pad(secs % 60)}`
}

// Play a short beep using Web Audio API — no dependencies
function playBeep(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = "sine"
  osc.frequency.setValueAtTime(880, ctx.currentTime)
  gain.gain.setValueAtTime(0.4, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.6)
}

function playFanfare(ctx: AudioContext) {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12)
    gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4)
    osc.start(ctx.currentTime + i * 0.12)
    osc.stop(ctx.currentTime + i * 0.12 + 0.4)
  })
}

export function FocusTimer() {
  const [mode, setMode] = useState<Mode>("focus")
  const [timeLeft, setTimeLeft] = useState(DURATIONS.focus)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [tasks, setTasks] = useState<TaskOption[]>([])
  const [selectedTask, setSelectedTask] = useState<string>("")
  const [loadingTasks, setLoadingTasks] = useState(true)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch pending tasks for selector
  useEffect(() => {
    fetch("/api/tasks?status=PENDING")
      .then((r) => r.json())
      .then((data: TaskOption[]) => {
        setTasks(Array.isArray(data) ? data : [])
        setLoadingTasks(false)
      })
      .catch(() => setLoadingTasks(false))
  }, [])

  // Cleanup interval and AudioContext on unmount
  useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    audioCtxRef.current?.close()
  }, [])

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }, [])

  const handleComplete = useCallback(() => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)

    const ctx = getAudioCtx()
    if (mode === "focus") {
      playFanfare(ctx)
      setSessions((s) => s + 1)
      // Browser notification
      if (Notification.permission === "granted") {
        new Notification("¡Sesión completada!", {
          body: selectedTask
            ? `Terminaste 25 min en "${tasks.find((t) => t.id === selectedTask)?.title}"`
            : "Completaste una sesión de enfoque",
          icon: "/icons/icon-192.png",
        })
      }
    } else {
      playBeep(ctx)
    }
  }, [mode, selectedTask, tasks, getAudioCtx])

  // Timer tick
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setTimeout(handleComplete, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, handleComplete])

  function switchMode(m: Mode) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setMode(m)
    setTimeLeft(DURATIONS[m])
    setRunning(false)
  }

  function handleStartPause() {
    // Resume AudioContext on first user gesture
    getAudioCtx()
    setRunning((r) => !r)
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimeLeft(DURATIONS[mode])
    setRunning(false)
  }

  const total = DURATIONS[mode]
  const progress = (total - timeLeft) / total
  const color = MODE_COLORS[mode]

  // SVG circle params
  const R = 88
  const C = 2 * Math.PI * R
  const dash = C * progress
  const gap  = C - dash

  return (
    <div className="flex flex-col items-center gap-6 py-8 max-w-sm mx-auto w-full">

      {/* Mode tabs */}
      <div className="flex gap-1 rounded-xl p-1 w-full" style={{ background: "var(--s2)", border: "1px solid var(--b1)" }}>
        {(["focus", "short", "long"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className="flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{
              fontFamily: "var(--mono)",
              background: mode === m ? "var(--card)" : "transparent",
              color: mode === m ? color : "var(--tx2)",
              border: mode === m ? `1px solid var(--b1)` : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Circular timer */}
      <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
        <svg width="220" height="220" style={{ transform: "rotate(-90deg)" }}>
          {/* Track */}
          <circle cx="110" cy="110" r={R} fill="none"
            stroke="var(--s3)" strokeWidth="8" />
          {/* Progress */}
          <circle cx="110" cy="110" r={R} fill="none"
            stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: "stroke-dasharray 0.5s ease, stroke 0.3s ease" }}
          />
        </svg>
        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-[42px] font-bold tracking-tight tabular-nums"
            style={{ fontFamily: "var(--mono)", color: "var(--tx)", lineHeight: 1 }}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-[11px] uppercase tracking-[.1em]"
            style={{ fontFamily: "var(--mono)", color }}>
            {MODE_LABELS[mode]}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Reset */}
        <button
          onClick={handleReset}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
          aria-label="Reiniciar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 7a5 5 0 1 0 1-3M2 4V1M2 4h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Start / Pause */}
        <button
          onClick={handleStartPause}
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: color, border: "none", cursor: "pointer", boxShadow: `0 0 20px color-mix(in srgb, ${color} 40%, transparent)` }}
          aria-label={running ? "Pausar" : "Iniciar"}
        >
          {running ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="2" width="4" height="14" rx="1.5" fill="white"/>
              <rect x="11" y="2" width="4" height="14" rx="1.5" fill="white"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M5 3l11 6-11 6V3z" fill="white"/>
            </svg>
          )}
        </button>

        {/* Skip */}
        <button
          onClick={handleComplete}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-opacity hover:opacity-70"
          style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
          aria-label="Saltar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 3l8 4-8 4V3zM11 3v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Session counter */}
      <div className="flex items-center gap-2">
        <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
          Sesiones hoy:
        </span>
        <div className="flex gap-1">
          {Array.from({ length: Math.max(4, sessions) }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full"
              style={{ background: i < sessions ? color : "var(--s3)" }} />
          ))}
          {sessions > 4 && (
            <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color }}>+{sessions - 4}</span>
          )}
        </div>
      </div>

      {/* Task selector */}
      <div className="w-full rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
        <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
          <p className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
            Trabajando en
          </p>
        </div>
        <div className="px-4 py-3">
          {loadingTasks ? (
            <div className="h-8 rounded-lg animate-pulse" style={{ background: "var(--s3)" }} />
          ) : tasks.length === 0 ? (
            <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              Sin tareas pendientes
            </p>
          ) : (
            <select
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              className="w-full bg-transparent text-[12px] outline-none"
              style={{ color: "var(--tx)", fontFamily: "var(--mono)", border: "none", cursor: "pointer" }}
            >
              <option value="" style={{ background: "var(--card)" }}>— Selecciona una tarea —</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id} style={{ background: "var(--card)" }}>
                  {t.title}{t.courseName ? ` · ${t.courseName.split(" ").slice(-1)[0]}` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tips */}
      <p className="text-[10px] text-center" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
        {mode === "focus"
          ? "25 min de enfoque total · Cierra notificaciones y redes sociales"
          : mode === "short"
          ? "5 min · Levántate, toma agua, descansa los ojos"
          : "15 min · Recarga energía antes del siguiente bloque"}
      </p>
    </div>
  )
}
