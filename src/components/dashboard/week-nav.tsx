"use client"

import { useRouter, useSearchParams } from "next/navigation"

export function WeekNav({ weekOffset, label }: { weekOffset: number; label: string }) {
  const router = useRouter()
  const params = useSearchParams()

  function go(delta: number) {
    const p = new URLSearchParams(params.toString())
    p.set("week", String(weekOffset + delta))
    router.push(`/dashboard/calendario?${p.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(-1)}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
        aria-label="Semana anterior"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M7 2L4 5.5L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <span className="text-[11px] font-medium" style={{ fontFamily: "var(--mono)", color: "var(--tx)", minWidth: 90, textAlign: "center" }}>
        {label}
      </span>
      <button
        onClick={() => go(+1)}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
        style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", cursor: "pointer" }}
        aria-label="Semana siguiente"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M4 2L7 5.5L4 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {weekOffset !== 0 && (
        <button
          onClick={() => { const p = new URLSearchParams(params.toString()); p.delete("week"); router.push(`/dashboard/calendario?${p.toString()}`) }}
          className="text-[10px] px-2 py-1 rounded transition-opacity hover:opacity-70"
          style={{ fontFamily: "var(--mono)", color: "var(--blue)", cursor: "pointer", background: "var(--blue-d)", border: "1px solid var(--blue-b)" }}
        >
          Hoy
        </button>
      )}
    </div>
  )
}
