"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function SemesterFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("sem") ?? "0"

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (val === "0") {
      params.delete("sem")
    } else {
      params.set("sem", val)
    }
    const qs = params.toString()
    router.push(pathname + (qs ? `?${qs}` : ""))
  }

  return (
    <div className="px-2 pb-2">
      <label
        className="block text-[9px] uppercase tracking-[.12em] px-2 pb-1"
        style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}
      >
        Semestre
      </label>
      <select
        value={current}
        onChange={handleChange}
        className="w-full h-8 rounded-lg px-2 text-[12px] outline-none transition-all"
        style={{
          background: "var(--s2)",
          border: "1px solid var(--b1)",
          color: "var(--tx)",
          fontFamily: "var(--mono)",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 3.5l3 3 3-3' stroke='%236b6b6f' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          paddingRight: "24px",
        }}
      >
        <option value="0">Todos los semestres</option>
        <option value="1">1° Semestre</option>
        <option value="2">2° Semestre</option>
        <option value="3">3° Semestre</option>
        <option value="4">4° Semestre</option>
        <option value="5">5° Semestre</option>
        <option value="6">6° Semestre</option>
      </select>
    </div>
  )
}
