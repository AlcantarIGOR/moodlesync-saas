"use client"

import { useRef, useEffect } from "react"

// ─── High-DPI Constellation Particle Canvas ──────────────────────────────────
export function LoginGlow() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = window.innerWidth
    let height = window.innerHeight

    // Handling high density retina/4k displays for crisp connections and nodes
    const handleResize = () => {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = "100%"
      canvas.style.height = "100%"
      
      ctx.scale(dpr, dpr)
      width = rect.width
      height = rect.height
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    // Setup slow floating nodes
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      radius: number
    }> = []

    const particleCount = 22 // Perfectly balanced for left-panel width
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.16,
        radius: Math.random() * 1.5 + 0.6,
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      // Connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
          if (dist < 110) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(75, 140, 248, ${0.12 * (1 - dist / 110)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Nodes
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(75, 140, 248, 0.42)"
        ctx.shadowColor = "#4b8cf8"
        ctx.shadowBlur = 3
        ctx.fill()
        ctx.shadowBlur = 0

        p.x += p.vx
        p.y += p.vy

        // Boundaries wrap
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
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      />
      {/* Static premium highlights */}
      <div 
        className="absolute z-10 hidden md:block animate-pulse-slow"
        style={{ left: "20%", top: "26%" }}
      >
        <div
          className="rounded-full w-[3px] h-[3px]"
          style={{
            background: "rgb(75, 140, 248)",
            boxShadow: "0 0 9px 3px rgba(75, 140, 248, 0.4)",
          }}
        />
      </div>
      <div 
        className="absolute z-10 hidden md:block animate-pulse-slow"
        style={{ left: "72%", top: "72%", animationDelay: "1.2s" }}
      >
        <div
          className="rounded-full w-[3px] h-[3px]"
          style={{
            background: "rgb(75, 140, 248)",
            boxShadow: "0 0 9px 3px rgba(75, 140, 248, 0.4)",
          }}
        />
      </div>
    </>
  )
}
