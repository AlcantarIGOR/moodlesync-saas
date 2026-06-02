"use client"

import { useRef, useState, useEffect } from "react"
import { useGSAP } from "@gsap/react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import Link from "next/link"
import {
  CheckSquare, CalendarDays, BarChart3, Timer, StickyNote,
  GraduationCap, ChevronRight, ArrowRight, Zap, Bell, Lock, Shield, Plus, Minus
} from "lucide-react"

gsap.registerPlugin(useGSAP, ScrollTrigger)

// ─── Pixel-Perfect High-DPI Canvas Constellation Background ──────────────────
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = window.innerWidth
    let height = window.innerHeight

    // High-DPI (Retina/4K) scale handling to fix blurriness and distortion
    const handleResize = () => {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const displayWidth = window.innerWidth
      const displayHeight = window.innerHeight

      // Scale drawing buffer to match device pixel density
      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr

      // Keep visual layout scale standard
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`

      // Normalize drawing scale for crisp vector arcs and lines
      ctx.scale(dpr, dpr)

      width = displayWidth
      height = displayHeight
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    // Slow moving glowing cian nodes
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = []

    const particleCount = 38
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        radius: Math.random() * 1.5 + 0.6, // Smaller, crisp dots
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw crystal-clear connecting threads
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(75, 140, 248, ${0.15 * (1 - dist / 120)})`
            ctx.lineWidth = 0.6 // Hair-thin, perfectly anti-aliased connection lines
            ctx.stroke()
          }
        }
      }

      // Draw tack-sharp glowing particles
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(75, 140, 248, 0.5)"
        ctx.shadowColor = "#4b8cf8"
        ctx.shadowBlur = 4
        ctx.fill()
        ctx.shadowBlur = 0 // reset shadow

        p.x += p.vx
        p.y += p.vy

        // Wrap boundaries
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
    />
  )
}

// ─── Glowing Dot ──────────────────────────────────────────────────────────────
const GlowDot = ({ x, y, size = 4, delay = "0s", hue = 217 }: { x: string; y: string; size?: number; delay?: string; hue?: number }) => (
  <div
    className="absolute z-10 hidden md:block animate-pulse-slow"
    style={{ left: x, top: y, animationDelay: delay }}
  >
    <div
      className="rounded-full"
      style={{
        width: size, height: size,
        background: `hsl(${hue}, 95%, 60%)`,
        boxShadow: `0 0 ${size * 3}px ${size}px hsla(${hue}, 95%, 60%, 0.4), 0 0 ${size * 8}px ${size * 2}px hsla(${hue}, 80%, 50%, 0.15)`,
      }}
    />
  </div>
)

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useGSAP(() => {
    // ── 1. Nav slide-down ─────────────────────────────────────────────────
    gsap.fromTo("nav",
      { opacity: 0, y: -14 },
      { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }
    )

    // ── 2. Hero elements stagger ──────────────────────────────────────────
    gsap.fromTo("[data-hero]",
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out", delay: 0.1 }
    )

    // ── 3. Cyber Console reveal ───────────────────────────────────────────
    gsap.fromTo(".cyber-console-wrapper",
      { opacity: 0, scale: 0.95, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "power2.out", delay: 0.3 }
    )

    // ── 4. Stats count-up on scroll ───────────────────────────────────────
    ScrollTrigger.create({
      trigger: ".stats-strip",
      start: "top 88%",
      once: true,
      onEnter: () => {
        const el = document.querySelector<HTMLElement>(".stat-pct")
        if (el) {
          const obj = { v: 0 }
          gsap.to(obj, {
            v: 100, duration: 1.4, ease: "power1.out",
            onUpdate() { el.textContent = Math.round(obj.v) + "%" },
          })
        }
        // Fade-in the other two stats
        gsap.fromTo(".stat-item",
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "power2.out" }
        )
      },
    })

    // ── 5. Features section header ────────────────────────────────────────
    gsap.fromTo(".features-header",
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 0.5, ease: "power2.out",
        scrollTrigger: { trigger: ".features-header", start: "top 85%" },
      }
    )

    // ── 6. Feature cards stagger ──────────────────────────────────────────
    gsap.fromTo(".feature-card",
      { opacity: 0, y: 36, scale: 0.96 },
      {
        opacity: 1, y: 0, scale: 1,
        duration: 0.5, stagger: 0.09, ease: "power2.out",
        scrollTrigger: { trigger: ".features-grid", start: "top 82%" },
      }
    )

    // ── 7. "Cómo funciona" steps slide in ─────────────────────────────────
    gsap.fromTo(".how-step",
      { opacity: 0, x: -22 },
      {
        opacity: 1, x: 0,
        duration: 0.48, stagger: 0.14, ease: "power2.out",
        scrollTrigger: { trigger: ".how-grid", start: "top 82%" },
      }
    )

    // ── 8. FAQ reveal ─────────────────────────────────────────────────────
    gsap.fromTo(".faq-item",
      { opacity: 0, y: 16 },
      {
        opacity: 1, y: 0,
        duration: 0.45, stagger: 0.08, ease: "power2.out",
        scrollTrigger: { trigger: ".faq-section", start: "top 82%" },
      }
    )

    // ── 9. CTA section reveal ─────────────────────────────────────────────
    gsap.fromTo(".cta-el",
      { opacity: 0, y: 24 },
      {
        opacity: 1, y: 0,
        duration: 0.52, stagger: 0.1, ease: "power2.out",
        scrollTrigger: { trigger: ".cta-section", start: "top 82%" },
      }
    )

    // ── 10. CTA button pulse ──────────────────────────────────────────────
    ScrollTrigger.create({
      trigger: ".cta-section",
      start: "top 82%",
      once: true,
      onEnter: () => {
        gsap.to(".cta-btn", {
          scale: 1.035,
          duration: 1.15,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: 0.7,
        })
      },
    })

  }, { scope: rootRef })

  // Handles dynamic console tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    const card = consoleRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    const x = e.clientX - rect.left - w / 2
    const y = e.clientY - rect.top - h / 2
    card.style.setProperty("--tilt", `perspective(1000px) rotateX(${-(y / (h / 2)) * 3}deg) rotateY(${(x / (w / 2)) * 3}deg) scale3d(1.008, 1.008, 1.008)`)
  }

  const handleMouseLeave = () => {
    const card = consoleRef.current
    if (!card) return
    card.style.setProperty("--tilt", `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`)
  }

  return (
    <div ref={rootRef} className="relative min-h-screen" style={{ background: "var(--bg)", color: "var(--tx)", overflowX: "hidden" }}>
      
      {/* Estilos CSS Inyectados para Animaciones de Alta Fidelidad sin dependencias */}
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(1deg); }
        }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(-1deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(1.08); }
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        .animate-float-medium {
          animation: float-medium 5s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Orbes de iluminación ambientales de fondo — Neon Ciber de alta visibilidad (Cian/Azul) */}
      <div className="absolute top-[-5%] left-[5%] w-[650px] h-[650px] bg-blue-500/[0.08] rounded-full blur-[140px] pointer-events-none animate-pulse-slow z-0" style={{ animationDuration: "8s" }} />
      <div className="absolute top-[10%] right-[10%] w-[550px] h-[550px] bg-cyan-500/[0.07] rounded-full blur-[130px] pointer-events-none animate-pulse-slow z-0" style={{ animationDuration: "12s" }} />
      <div className="absolute bottom-[20%] left-[20%] w-[600px] h-[600px] bg-blue-600/[0.04] rounded-full blur-[150px] pointer-events-none z-0" />

      {/* High-DPI Pixel-Perfect Constellation Background */}
      <ParticleCanvas />

      {/* Nodos de Sincronización Decorativos */}
      <GlowDot x="6%" y="24%" size={5} delay="0s" hue={215} />
      <GlowDot x="42%" y="15%" size={3} delay="1.2s" hue={190} />
      <GlowDot x="8%" y="78%" size={4} delay="0.5s" hue={210} />

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-[64px] sticky top-0 z-50 transition-all border-b"
        style={{ background: "var(--bg-glass)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.06)", opacity: 0 }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 text-white hover:opacity-90 transition-all select-none">
            <div aria-hidden="true" className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--blue) 0%, #06b6d4 100%)" }}>
              <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" fill="white"/>
                <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.8"/>
              </svg>
            </div>
            <span className="text-base font-bold tracking-tight">MoodleSync</span>
          </Link>
          <a href="https://onyxinc.dev/edu" target="_blank" rel="noopener noreferrer" 
            className="hidden sm:inline text-[9px] px-2 py-0.5 rounded font-semibold tracking-wider uppercase transition-all hover:scale-105 active:scale-95"
            style={{ fontFamily: "var(--mono)", background: "rgba(75,140,248,0.1)", color: "var(--blue)", border: "1px solid rgba(75,140,248,0.2)", textDecoration: "none" }}>
            by ONYX Inc.
          </a>
        </div>
        <Link href="/login"
          className="flex items-center h-9 px-5 rounded-full text-xs font-bold transition-all hover:scale-105"
          style={{ background: "var(--blue)", color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 0 15px rgba(75,140,248,0.2)" }}>
          Iniciar sesión
        </Link>
      </nav>

      <main>
      {/* ── HERO (Layout Asimétrico en 2 Columnas de Producto) ── */}
      <section className="relative px-6 md:px-12 pt-20 pb-24 overflow-hidden max-w-7xl mx-auto z-10">
        
        {/* Grid 3D de Perspectiva en el fondo de la pantalla — Más visible y anti-aliased por GPU */}
        <div className="absolute -top-[40%] -left-[20%] -right-[20%] -bottom-[20%] w-[140%] h-[140%] pointer-events-none opacity-[0.24] z-0" style={{
          backgroundImage: "linear-gradient(to right, rgba(75,140,248,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(75,140,248,0.14) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          transform: "rotateX(60deg) translateY(-10%) translateZ(0)",
          transformOrigin: "center top",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 50% at 50% 30%, black 20%, transparent 80%)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Columna Izquierda: Información y Acceso */}
          <div className="lg:col-span-5 text-left flex flex-col items-start relative z-10">
            
            {/* Badge de Sincronización */}
            <div data-hero className="relative mb-6 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-float-medium"
              style={{ fontFamily: "var(--mono)", background: "rgba(75,140,248,0.08)", color: "var(--blue)", border: "1px solid rgba(75,140,248,0.25)", opacity: 0 }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: "var(--blue)" }} />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "var(--blue)" }} />
              </span>
              Estudiantes del ITCG
            </div>

            <h1 data-hero className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight mb-5 text-white"
              style={{ letterSpacing: "-1.5px", opacity: 0 }}>
              Tu Moodle ITCG,
              <br />
              <span className="gradient-text">sin el caos.</span>
            </h1>

            <p data-hero className="text-sm md:text-base leading-relaxed mb-8 text-white/50 max-w-lg"
              style={{ opacity: 0 }}>
              Sincroniza tus cursos escolares automáticamente. Gestiona tareas pendientes, boleta de calificaciones y tu horario semanal en una sola consola ágil diseñada para ti.
            </p>

            <div data-hero className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto" style={{ opacity: 0 }}>
              <div className="p-[1px] rounded-full" style={{ background: "linear-gradient(135deg, #4b8cf8 0%, #06b6d4 100%)" }}>
                <Link href="/login"
                  className="flex items-center justify-center gap-2 h-11 px-8 rounded-full text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "var(--blue)", color: "#fff", textDecoration: "none", boxShadow: "0 4px 15px rgba(75,140,248,0.3)" }}>
                  Conectar cuenta <ArrowRight size={14} />
                </Link>
              </div>
              <a href="#features"
                className="flex items-center justify-center h-11 px-6 rounded-full text-xs font-semibold transition-all border border-white/10 hover:border-white/20 hover:bg-white/5"
                style={{ color: "var(--tx)", textDecoration: "none" }}>
                Ver funciones
              </a>
            </div>

            <p data-hero className="mt-5 text-[9px] tracking-wide"
              style={{ fontFamily: "var(--mono)", color: "var(--tx3)", opacity: 0 }}>
              Mismas credenciales de tu portal Moodle · Sin registros extras
            </p>
          </div>

          {/* Columna Derecha: Mockup Interactivo del Dashboard (Consola de Producto) */}
          <div className="lg:col-span-7 flex justify-center lg:justify-end cyber-console-wrapper z-10" style={{ opacity: 0 }}>
            <div
              ref={consoleRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full max-w-[540px] bg-[#121215]/80 border border-white/[0.08] rounded-2xl shadow-2xl p-5 md:p-6 backdrop-blur-xl relative overflow-hidden select-none"
              style={{
                transform: "var(--tilt, perspective(1000px) rotateX(0deg) rotateY(0deg))",
                transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              {/* Resplandor superior de la consola */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent" />
              
              {/* Barra de cabecera estilo Sistema Operativo */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/30 flex items-center gap-1.5" style={{ fontFamily: "var(--mono)" }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  MoodleSync CONSOLE v8.0
                </div>
              </div>

              {/* Contenido Simulado de la Aplicación */}
              <div className="space-y-4">
                
                {/* 1. Sync Status */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Zap size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-white leading-none mb-1">Moodle Sincronizado</h4>
                      <p className="text-[9px] text-white/30" style={{ fontFamily: "var(--mono)" }}>apps.cdguzman.tecnm.mx</p>
                    </div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-full">
                    ACTIVO
                  </span>
                </div>

                {/* 2. Próximas Entregas (2 Tareas) */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold tracking-wider text-white/20 uppercase" style={{ fontFamily: "var(--mono)" }}>
                    Próximas entregas
                  </p>
                  
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex items-center justify-between hover:border-blue-500/15 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-mono text-[9px] font-bold flex-shrink-0">
                        HOY
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">Práctica 3: Scraper de Boletas</p>
                        <p className="text-[9px] text-white/40 truncate">Estructura de Datos</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-red-500/15 border border-red-500/20 text-red-400 font-bold rounded uppercase shrink-0">
                      Urgente
                    </span>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex items-center justify-between hover:border-blue-500/15 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-mono text-[9px] font-bold flex-shrink-0">
                        3D
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">Reporte de Consultas SQL Server</p>
                        <p className="text-[9px] text-white/40 truncate">Taller de Bases de Datos</p>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 bg-amber-500/15 border border-amber-500/20 text-amber-400 font-bold rounded uppercase shrink-0">
                      Pendiente
                    </span>
                  </div>
                </div>

                {/* 3. Horario Activo (Ahora en Clase) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex flex-col justify-between h-20">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider" style={{ fontFamily: "var(--mono)" }}>Ahora en Clase</span>
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white truncate">Redes de Computadoras</p>
                      <p className="text-[9px] text-white/35">Aula L2 · 09:00 - 11:00</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex items-center gap-3.5 h-20">
                    <div className="relative w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border border-blue-500/25">
                      <span className="text-[10px] font-bold font-mono text-blue-400">25m</span>
                      <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(75,140,248,0.1)" strokeWidth="2"/>
                        <circle cx="20" cy="20" r="18" fill="none" stroke="var(--blue)" strokeWidth="2" strokeDasharray="113" strokeDashoffset="35"/>
                      </svg>
                    </div>
                    <div>
                      <span className="text-[9px] text-white/30 uppercase font-bold tracking-wider" style={{ fontFamily: "var(--mono)" }}>Modo Focus</span>
                      <p className="text-[11px] font-bold text-white leading-none mt-0.5">Bloque Activo</p>
                      <p className="text-[9px] text-blue-400/70 font-mono mt-0.5">Pomodoro</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="stats-strip border-y" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 gap-6 text-center">
          <div className="stat-item flex flex-col items-center" role="group" aria-label="100% gratis para empezar" style={{ opacity: 0 }}>
            <p className="stat-pct text-3xl font-bold mb-1" aria-hidden="true" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>0%</p>
            <p className="text-[10px] font-bold tracking-wider uppercase" aria-hidden="true" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Gratis para empezar</p>
          </div>
          <div className="stat-item flex flex-col items-center" role="group" aria-label="Sincronización Moodle automática" style={{ opacity: 0 }}>
            <p className="text-3xl font-bold mb-1" aria-hidden="true" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>Auto</p>
            <p className="text-[10px] font-bold tracking-wider uppercase" aria-hidden="true" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Sincronización Moodle</p>
          </div>
          <div className="stat-item flex flex-col items-center" role="group" aria-label="Cero registros adicionales" style={{ opacity: 0 }}>
            <p className="text-3xl font-bold mb-1" aria-hidden="true" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>0</p>
            <p className="text-[10px] font-bold tracking-wider uppercase" aria-hidden="true" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Registros adicionales</p>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="px-6 md:px-12 py-28 max-w-6xl mx-auto">
        <div className="features-header text-center mb-16" style={{ opacity: 0 }}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-4">
            Funcionalidades
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4" style={{ letterSpacing: "-0.8px" }}>
            Diseñado para el ritmo del semestre
          </h2>
          <p className="text-white/40 max-w-xl mx-auto text-sm leading-relaxed">
            Todas tus materias y calificaciones centralizadas automáticamente. Sin instalar nada.
          </p>
        </div>

        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: <CheckSquare size={20} />,
              title: "Tareas centralizadas",
              desc: "Todas tus entregas organizadas automáticamente por urgencia. Incluye recordatorios diarios por correo a las 8:00 AM y notificaciones web push.",
            },
            {
              icon: <CalendarDays size={20} />,
              title: "Horario y calendario",
              desc: "Vista semanal con posicionamiento por hora. Muestra en tiempo real la clase activa y la próxima entrega en tu panel de control.",
            },
            {
              icon: <BarChart3 size={20} />,
              title: "Boleta y analíticas",
              desc: "Visualización unificada de calificaciones de Moodle y parciales de Mindbox. Calcula tu promedio por periodo e incluye análisis de riesgo escolar.",
            },
            {
              icon: <Timer size={20} />,
              title: "Modo Focus (Pomodoro)",
              desc: "Temporizador Pomodoro integrado con sonidos de concentración y selector de tareas. Mantén el enfoque en tus entregas sin salir de la plataforma.",
            },
            {
              icon: <StickyNote size={20} />,
              title: "Tablero de notas",
              desc: "Canvas infinito con post-its virtuales para apuntes rápidos por materia. Permite compartir notas y colaborar con tus compañeros de clase.",
            },
            {
              icon: <GraduationCap size={20} />,
              title: "Entrega con compresión",
              desc: "Sube archivos PDF directamente a Moodle con compresión automática del lado del cliente (de 20 MB a ~2 MB), sin saturar los servidores.",
            },
          ].map(({ icon, title, desc }, index) => (
            <div key={title}
              className="feature-card group relative rounded-2xl p-6 flex flex-col gap-4 transition-all duration-500 hover:border-blue-500/25 cursor-default"
              onMouseMove={(e) => {
                const card = e.currentTarget;
                const rect = card.getBoundingClientRect();
                card.style.setProperty("--fx", `${e.clientX - rect.left}px`);
                card.style.setProperty("--fy", `${e.clientY - rect.top}px`);
              }}
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", opacity: 0, overflow: "hidden" }}
            >
              {/* Radial glow spotlight */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{ background: `radial-gradient(280px circle at var(--fx, 50%) var(--fy, 50%), rgba(75, 140, 248, 0.06), transparent 75%)` }} />
              
              {/* Glowing top line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/0 group-hover:via-blue-500/30 to-transparent transition-all duration-500" />

              <div aria-hidden="true" className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:bg-blue-500/15 group-hover:shadow-[0_0_20px_rgba(75,140,248,0.15)]"
                style={{ background: "rgba(75,140,248,0.08)", border: "1px solid rgba(75,140,248,0.2)", color: "var(--blue)" }}>
                {icon}
              </div>
              <div className="relative z-10">
                <p className="text-sm font-semibold mb-2 group-hover:text-white transition-colors duration-300" style={{ color: "var(--tx)" }}>{title}</p>
                <p className="text-[12px] leading-relaxed transition-colors duration-300 group-hover:text-white/50" style={{ color: "var(--tx2)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 md:px-12 py-24" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-4">
              Cómo funciona
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: "-0.8px" }}>
              En 3 pasos, listo.
            </h2>
            <p className="text-white/40 max-w-md mx-auto text-xs leading-relaxed">
              Sin configuraciones técnicas ni registros complejos. Autenticación directa.
            </p>
          </div>

          <div className="how-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Inicia sesión", desc: "Ingresa con tu número de control y contraseña del portal Moodle del ITCG. Sin registros ni cuentas adicionales." },
              { step: "02", title: "Sincronización automática", desc: "MoodleSync conecta con tus portales escolares y organiza tus tareas, horarios y calificaciones al instante." },
              { step: "03", title: "Gestiona tu semestre", desc: "Organiza tus entregas por prioridad, mantén la concentración con el modo focus y sube tus tareas directamente." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="how-step flex flex-col gap-3" style={{ opacity: 0 }}>
                <div className="text-4xl font-bold font-mono tracking-tight" style={{ color: "var(--blue)", opacity: 0.25 }}>
                  {step}
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--tx)" }}>{title}</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--tx2)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY CALLOUT ── */}
      <section className="px-6 py-28 relative overflow-hidden" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(75, 140, 248, 0.03) 0%, transparent 65%)" }} />
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div className="p-8 bg-white/[0.015] border border-white/[0.08] rounded-2xl relative overflow-hidden backdrop-blur-md">
            {/* Spotlight decorativo */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.08] rounded-full blur-2xl pointer-events-none" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-blue-400 text-[9px] font-bold tracking-wider uppercase mb-5" style={{ fontFamily: "var(--mono)" }}>
              Seguridad Integrada
            </span>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold mb-0.5">Acceso Seguro</h4>
                  <p className="text-white/40 text-[11px] leading-normal">
                    Autenticación oficial mediante token de Moodle. Tus credenciales de consulta escolar se cifran de forma segura.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold mb-0.5">Cifrado de Datos</h4>
                  <p className="text-white/40 text-[11px] leading-normal">
                    Toda comunicación con los portales educativos se realiza mediante canales seguros HTTPS con TLS.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <Bell size={16} />
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold mb-0.5">Soporte Offline</h4>
                  <p className="text-white/40 text-[11px] leading-normal">
                    Acceso rápido y PWA instalable para revisar tus materias y tareas sin depender de la estabilidad del portal escolar.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold tracking-wider uppercase mb-3">
              ✦ Privacidad y Conectividad
            </span>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4">
              Tus credenciales viajan de forma segura.
            </h3>
            <p className="text-white/45 text-sm leading-relaxed mb-6">
              MoodleSync no recopila tus claves escolares para comercializarlas. Toda conexión se realiza mediante canales seguros HTTPS cifrados con TLS de extremo a extremo, resguardando tus accesos de forma transparente.
            </p>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "var(--mono)" }}>
              <Zap size={14} /> Cifrado activo y transparente
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section className="faq-section px-6 py-28 relative overflow-hidden" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.005)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-4">
              Dudas Comunes
            </span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white" style={{ letterSpacing: "-0.8px" }}>
              Preguntas frecuentes
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "¿Necesito pedirle autorización a mi escuela?",
                a: "No. MoodleSync se conecta directamente con tu portal educativo Moodle del ITCG. No requiere integraciones en el servidor del instituto ni aprobaciones administrativas."
              },
              {
                q: "¿Es completamente gratis?",
                a: "Sí. MoodleSync tiene acceso gratuito completo para todos los alumnos del ITCG. Todas las funcionalidades de la aplicación están disponibles sin costo tras eliminarse los planes de pago en abril de 2026."
              },
              {
                q: "¿Funciona en mi celular?",
                a: "Sí. MoodleSync está desarrollado como una Aplicación Web Progresiva (PWA). Puedes instalarla directamente desde tu navegador en iOS y Android y usarla de forma fluida."
              },
              {
                q: "¿Mis contraseñas están seguras?",
                a: "Absolutamente. La autenticación de Moodle se realiza mediante el sistema de tokens oficial. Las credenciales opcionales de Mindbox para sincronizar horario y calificaciones se almacenan cifradas localmente con algoritmos AES-256-GCM. Ninguna contraseña es compartida."
              },
              {
                q: "¿Funciona para otras escuelas?",
                a: "Actualmente, la plataforma está optimizada y adaptada con exclusividad para la comunidad estudiantil del ITCG (Instituto Tecnológico de Ciudad Guzmán)."
              },
              {
                q: "¿Con qué frecuencia se actualizan mis datos?",
                a: "Tus tareas y calificaciones se sincronizan en tiempo real cada vez que ingresas a la aplicación o pulsas el botón de actualización. El sistema también actualiza información en segundo plano."
              }
            ].map((faq, i) => (
              <div key={i} className="faq-item" style={{ opacity: 0 }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-5 bg-white/[0.015] border border-white/[0.07] hover:border-white/15 rounded-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-white/80 text-xs md:text-sm font-semibold">{faq.q}</span>
                    <span className="text-white/30 flex-shrink-0 mt-0.5">
                      {openFaq === i ? <Minus size={15} /> : <Plus size={15} />}
                    </span>
                  </div>
                  {openFaq === i && (
                    <div className="mt-3 text-white/50 text-[11px] md:text-xs leading-relaxed border-t border-white/[0.04] pt-3">
                      {faq.a}
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="cta-section px-6 py-28 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(75, 140, 248, 0.05) 0%, transparent 65%)" }} />
        
        <span className="cta-el relative inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-5"
          style={{ fontFamily: "var(--mono)", opacity: 0 }}>
          Acceso instantáneo con tus credenciales ITCG · Compatible como App Móvil (PWA)
        </span>
        
        <h2 className="cta-el relative text-3xl md:text-5xl font-bold mb-4 tracking-tight leading-none text-white"
          style={{ letterSpacing: "-1px", opacity: 0 }}>
          Deja de perder fechas de entrega.
        </h2>
        <p className="cta-el relative text-sm md:text-base mb-10 max-w-md mx-auto"
          style={{ color: "var(--tx2)", opacity: 0 }}>
          Entra con tu cuenta del ITCG y ten todas tus materias organizadas en menos de un minuto.
        </p>
        
        <div className="cta-el" style={{ opacity: 0, display: "inline-flex" }}>
          <div className="p-[1px] rounded-full" style={{
            background: "linear-gradient(135deg, #4b8cf8 0%, #93c5fd 100%)",
          }}>
            <Link href="/login"
              className="cta-btn inline-flex items-center gap-2 h-11 px-8 rounded-full text-sm font-bold transition-all hover:scale-[1.03]"
              style={{ background: "var(--blue)", color: "#fff", textDecoration: "none", boxShadow: "0 4px 20px rgba(75, 140, 248, 0.35)" }}>
              Empezar gratis
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-12 py-8 flex items-center justify-between flex-wrap gap-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-all select-none">
            <div aria-hidden="true" className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ background: "var(--blue)" }}>
              <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" fill="white"/>
                <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.8"/>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight">MoodleSync</span>
          </Link>
          <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
            · <a href="https://onyxinc.dev" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" style={{ textDecoration: "underline" }}>by ONYX Inc.</a> · 2026 · <a href="https://github.com/AlcantarIGOR/moodlesync-saas" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" style={{ textDecoration: "underline" }}>Código Abierto</a>
          </span>
        </div>
        <Link href="/login" className="text-[10px] font-semibold tracking-wider uppercase text-white/50 hover:text-white transition-colors"
          style={{ fontFamily: "var(--mono)", textDecoration: "none" }}>
          Iniciar sesión →
        </Link>
      </footer>
    </div>
  )
}
