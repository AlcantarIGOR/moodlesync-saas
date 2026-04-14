"use client"

import { useEffect, useState } from "react"

const HOUR_PX      = 64
const GRID_START_H = 7   // 07:00
const GRID_END_H   = 21  // 21:00

function getNowMinsMX(): number {
  const mx = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Mexico_City" }))
  return mx.getHours() * 60 + mx.getMinutes()
}

export function CurrentTimeLine() {
  const [mins, setMins] = useState<number | null>(null)

  useEffect(() => {
    const update = () => setMins(getNowMinsMX())
    update()
    const id = setInterval(update, 30_000) // refresh every 30s
    return () => clearInterval(id)
  }, [])

  if (mins === null) return null

  const GRID_START_MIN = GRID_START_H * 60
  const GRID_END_MIN   = GRID_END_H   * 60
  if (mins < GRID_START_MIN || mins > GRID_END_MIN) return null

  const top = (mins - GRID_START_MIN) * HOUR_PX / 60

  return (
    <div
      style={{ position: "absolute", top, left: 0, right: 0, zIndex: 20, pointerEvents: "none" }}
    >
      {/* Dot */}
      <div style={{
        position: "absolute", left: -4, top: -4,
        width: 8, height: 8, borderRadius: "50%",
        background: "var(--red)",
      }} />
      {/* Line */}
      <div style={{ height: 2, background: "var(--red)", opacity: 0.85 }} />
    </div>
  )
}
