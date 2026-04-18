"use client"

import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import Link from "next/link"

gsap.registerPlugin(useGSAP)

// ---------------------------------------------------------------------------
// Stat cards (4-up grid)
// ---------------------------------------------------------------------------

export function DashboardStats({
  total, completadas, pendientes, urgentes, vencidas, pct,
}: {
  total: number
  completadas: number
  pendientes: number
  urgentes: number
  vencidas: number
  pct: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const cards = ref.current?.querySelectorAll("[data-stat-card]")
    if (!cards?.length) return
    gsap.fromTo(cards,
      { opacity: 0, y: 20, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: "power3.out", stagger: 0.07, clearProps: "transform,scale" }
    )
  }, { scope: ref })

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Total */}
      <div data-stat-card className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Total</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--blue-d)" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M2 7h6M2 10h8" stroke="var(--blue)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx)" }}>{total}</p>
        <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>tareas en total</p>
        <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "var(--blue)" }} />
        </div>
        <p className="text-[10px] mt-1" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>{pct}% completado</p>
      </div>

      {/* Completadas */}
      <div data-stat-card className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Completadas</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--green-d)" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="var(--green)" strokeWidth="1.3"/>
              <path d="M4.5 7l2 2 3.5-3.5" stroke="var(--green)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--green)" }}>{completadas}</p>
        <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>entregadas</p>
      </div>

      {/* Pendientes */}
      <div data-stat-card className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Pendientes</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--amber-d)" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="var(--amber)" strokeWidth="1.3"/>
              <path d="M7 4.5v3l1.5 1.5" stroke="var(--amber)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--amber)" }}>{pendientes}</p>
        <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>por entregar</p>
      </div>

      {/* Urgentes + Vencidas */}
      <div data-stat-card className="rounded-2xl p-4 relative overflow-visible" style={{ background: "var(--card)", border: `1px solid ${vencidas > 0 ? "var(--red-b)" : "var(--b1)"}` }}>
        {(urgentes + vencidas) > 0 && <div className="stat-halo" />}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Urgentes</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--red-d)" }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5L1.5 12.5h11L7 1.5z" stroke="var(--red)" strokeWidth="1.3" strokeLinejoin="round"/>
              <path d="M7 5.5v3M7 10v.5" stroke="var(--red)" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--red)" }}>{urgentes + vencidas}</p>
        <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
          {vencidas > 0 ? `${vencidas} vencida${vencidas !== 1 ? "s" : ""} · atención inmediata` : "atención inmediata"}
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Proximas grid — task cards that stagger in
// ---------------------------------------------------------------------------

type ProximaTask = {
  id: string
  title: string
  courseName: string | null
  dueDate: Date | null
}

function timeLeft(date: Date | null): string {
  if (!date) return "Sin fecha"
  const diff = Math.floor((new Date(date).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `Vencida hace ${Math.abs(diff)}d`
  if (diff === 0) return "Vence hoy"
  if (diff === 1) return "Vence mañana"
  return `${diff}d restantes`
}

function isOverdue(date: Date | null) {
  if (!date) return false
  const due = new Date(date).getTime()
  const now = Date.now()
  return due < now && (now - due) <= 10 * 86400000
}

function isUrgent(date: Date | null) {
  if (!date) return false
  const t = new Date(date).getTime()
  return t >= Date.now() && t < Date.now() + 7 * 86400000
}

const COURSE_COLORS = [
  { bg: "var(--blue-d)",   color: "var(--blue)" },
  { bg: "var(--purple-d)", color: "var(--purple)" },
  { bg: "var(--green-d)",  color: "var(--green)" },
  { bg: "var(--amber-d)",  color: "var(--amber)" },
  { bg: "var(--red-d)",    color: "var(--red)" },
]
function cc(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff
  return COURSE_COLORS[h % COURSE_COLORS.length]
}

export function ProximasGrid({
  tasks, semNum, total,
}: {
  tasks: ProximaTask[]
  semNum: number
  total: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    const cards = ref.current?.querySelectorAll("[data-proxima-card]")
    if (!cards?.length) return
    gsap.fromTo(cards,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.32, ease: "power2.out", stagger: 0.055, delay: 0.28, clearProps: "transform" }
    )
  }, { scope: ref })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[.1em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
          Próximas a vencer
        </p>
        <Link href={semNum > 0 ? `/dashboard/tareas?sem=${semNum}` : "/dashboard/tareas"}
          className="text-[11px] transition-all hover:opacity-80"
          style={{ fontFamily: "var(--mono)", color: "var(--blue)", textDecoration: "none" }}>
          Ver todas →
        </Link>
      </div>

      <div ref={ref}>
        {tasks.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
            <p className="text-xs" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              {total === 0 ? "Sin tareas — sincroniza para cargar" : "Sin tareas próximas pendientes"}
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(240px, 100%), 1fr))" }}>
            {tasks.map((t) => {
              const c = t.courseName ? cc(t.courseName) : { bg: "var(--blue-d)", color: "var(--blue)" }
              const overdue = isOverdue(t.dueDate)
              const urgent  = isUrgent(t.dueDate)
              const borderColor = overdue ? "var(--red-b)" : urgent ? "var(--amber-b)" : "var(--b1)"
              const timeColor   = overdue ? "var(--red)"  : urgent ? "var(--amber)"   : "var(--tx2)"
              return (
                <div key={t.id} data-proxima-card className="rounded-xl p-4"
                  style={{ background: "var(--card)", border: `1px solid ${borderColor}` }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="rounded px-2 py-0.5 text-[10px] font-medium shrink-0"
                      style={{ fontFamily: "var(--mono)", background: c.bg, color: c.color }}>
                      {t.courseName?.split(/\s+/).slice(-1)[0]?.slice(0, 10) ?? "—"}
                    </span>
                    <span className="text-[10px] shrink-0" style={{ fontFamily: "var(--mono)", color: timeColor }}>
                      {timeLeft(t.dueDate)}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium leading-snug" style={{ color: "var(--tx)" }}>{t.title}</p>
                  {t.courseName && (
                    <p className="text-[11px] mt-1 line-clamp-1" style={{ color: "var(--tx2)" }}>{t.courseName}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
