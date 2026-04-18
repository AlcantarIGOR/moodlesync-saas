import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import type { Grade } from "@prisma/client"
import { MindboxSyncButton } from "@/components/dashboard/mindbox-sync-button"

function gradeColor(g: number | null): string {
  if (g === null) return "var(--tx2)"
  if (g >= 70) return "var(--green)"
  if (g >= 60) return "var(--amber)"
  return "var(--red)"
}

function gradeBg(g: number | null): string {
  if (g === null) return "var(--s3)"
  if (g >= 70) return "var(--green-d)"
  if (g >= 60) return "var(--amber-d)"
  return "var(--red-d)"
}

function gradeBorder(g: number | null): string {
  if (g === null) return "var(--b1)"
  if (g >= 70) return "var(--green-b)"
  if (g >= 60) return "var(--amber-b)"
  return "var(--red-b)"
}

function PartialDots({ partials }: { partials: (number | null)[] }) {
  if (!partials.length) return null
  return (
    <div className="flex items-center gap-1 mt-1">
      {partials.map((p, i) => (
        <span
          key={i}
          className="text-[9px] rounded px-1 py-0.5"
          style={{
            fontFamily: "var(--mono)",
            color: gradeColor(p),
            background: gradeBg(p),
            border: `1px solid ${gradeBorder(p)}`,
          }}
        >
          {p ?? "—"}
        </span>
      ))}
    </div>
  )
}

function PeriodCard({ period, grades }: { period: string; grades: Grade[] }) {
  const periodName = grades[0]?.periodName ?? period
  const validGrades = grades.filter((g) => g.finalGrade !== null)
  const avg = validGrades.length
    ? Math.round(validGrades.reduce((s, g) => s + (g.finalGrade ?? 0), 0) / validGrades.length)
    : null

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--tx)" }}>{periodName}</h3>
        {avg !== null && (
          <span className="text-xs font-semibold rounded px-2 py-1 shrink-0"
            style={{ fontFamily: "var(--mono)", color: gradeColor(avg), background: gradeBg(avg), border: `1px solid ${gradeBorder(avg)}` }}>
            Prom. {avg}
          </span>
        )}
      </div>

      <div className="divide-y" style={{ borderColor: "var(--b1)" }}>
        {grades.map((g) => {
          const partials = Array.isArray(g.partialGrades) ? (g.partialGrades as (number | null)[]) : []
          return (
            <div key={g.id} className="px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium leading-snug" style={{ color: "var(--tx)" }}>
                  {g.subjectName}
                </p>
                <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                  {g.subjectCode} · {g.group} · {g.credits} créditos
                </p>
                <PartialDots partials={partials} />
                {g.evalType && (
                  <p className="text-[10px] mt-1" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
                    {g.evalType}
                  </p>
                )}
              </div>
              <span
                className="text-sm font-bold shrink-0 rounded-lg px-2.5 py-1.5 mt-0.5"
                style={{
                  fontFamily: "var(--mono)",
                  color: gradeColor(g.finalGrade),
                  background: gradeBg(g.finalGrade),
                  border: `1px solid ${gradeBorder(g.finalGrade)}`,
                  minWidth: 44,
                  textAlign: "center",
                }}
              >
                {g.finalGrade ?? "—"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default async function CalificacionesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { mindboxPassword: true },
  })

  const grades = await db.grade.findMany({
    where: { userId: session.user.id },
    orderBy: [{ period: "desc" }, { subjectCode: "asc" }],
  })

  // Group by period
  const byPeriod = new Map<string, Grade[]>()
  for (const g of grades) {
    if (!byPeriod.has(g.period)) byPeriod.set(g.period, [])
    byPeriod.get(g.period)!.push(g)
  }

  const lastSync = grades.length > 0
    ? new Date(Math.max(...grades.map((g) => new Date(g.syncedAt).getTime())))
    : null

  const hasMindbox = !!user?.mindboxPassword

  return (
    <div className="flex flex-col h-full">
      {/* Navbar */}
      <div className="flex items-center justify-between px-5 shrink-0"
        style={{ height: 54, borderBottom: "1px solid var(--b1)", background: "var(--bg-glass)", backdropFilter: "blur(10px)" }}>
        <div className="flex items-center gap-3">
          <span className="text-[15px] font-semibold" style={{ color: "var(--tx)", letterSpacing: "-.3px" }}>
            Calificaciones
          </span>
          <span className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
            — vía Mindbox
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastSync && (
            <span className="text-[10px] hidden sm:block" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
              actualizado {lastSync.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
            </span>
          )}
          <MindboxSyncButton hasCredentials={hasMindbox} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* ── ANÁLISIS GLOBAL ── */}
          {grades.length > 0 && (() => {
            const allValid = grades.filter((g) => g.finalGrade !== null)
            const globalAvg = allValid.length
              ? Math.round(allValid.reduce((s, g) => s + (g.finalGrade ?? 0), 0) / allValid.length)
              : null
            const lowestSubject = allValid.length
              ? allValid.reduce((a, b) => (a.finalGrade ?? 0) < (b.finalGrade ?? 0) ? a : b)
              : null
            const highestSubject = allValid.length
              ? allValid.reduce((a, b) => (a.finalGrade ?? 0) > (b.finalGrade ?? 0) ? a : b)
              : null

            // Calculate "necesitas X en parcial N" for subjects with partials
            type NeedCalc = { subject: string; needed: number; parcial: number }
            const needsCalc: NeedCalc[] = []
            for (const g of grades) {
              if (g.finalGrade !== null) continue // ya tiene nota final
              const partials = Array.isArray(g.partialGrades) ? (g.partialGrades as (number | null)[]) : []
              if (partials.length < 2) continue
              const known = partials.filter((p): p is number => p !== null)
              if (known.length === 0 || known.length >= partials.length) continue
              // Assumes simple average of all partials to reach 70 (passing)
              const needed = Math.ceil(70 * partials.length - known.reduce((s, v) => s + v, 0))
              const parcialNum = known.length + 1
              if (needed <= 100) {
                needsCalc.push({ subject: g.subjectName, needed: Math.max(0, needed), parcial: parcialNum })
              }
            }

            if (!globalAvg && needsCalc.length === 0) return null

            return (
              <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
                <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
                  <h3 className="text-sm font-semibold" style={{ color: "var(--tx)" }}>Análisis</h3>
                </div>

                <div className="p-4 space-y-4">
                  {/* Global average */}
                  {globalAvg !== null && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-[.08em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                          Promedio global
                        </span>
                        <span className="text-sm font-bold rounded-lg px-2.5 py-1"
                          style={{ fontFamily: "var(--mono)", color: gradeColor(globalAvg), background: gradeBg(globalAvg), border: `1px solid ${gradeBorder(globalAvg)}` }}>
                          {globalAvg}
                        </span>
                      </div>
                      {/* Grade bar */}
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, globalAvg)}%`, background: gradeColor(globalAvg) }} />
                      </div>
                    </div>
                  )}

                  {/* Subject bars */}
                  {allValid.length > 1 && (
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[.08em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                        Por materia
                      </p>
                      {allValid.sort((a, b) => (b.finalGrade ?? 0) - (a.finalGrade ?? 0)).map((g) => (
                        <div key={g.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] truncate mr-2" style={{ color: "var(--tx)", maxWidth: "70%" }}>
                              {g.subjectName}
                            </span>
                            <span className="text-[11px] shrink-0" style={{ fontFamily: "var(--mono)", color: gradeColor(g.finalGrade) }}>
                              {g.finalGrade}
                            </span>
                          </div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                            <div className="h-full rounded-full"
                              style={{ width: `${Math.min(100, g.finalGrade ?? 0)}%`, background: gradeColor(g.finalGrade) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Lowest subject callout */}
                  {lowestSubject && lowestSubject.finalGrade !== null && lowestSubject.finalGrade < 70 && (
                    <div className="rounded-xl px-3 py-2.5 flex items-start gap-2.5"
                      style={{ background: "var(--red-d)", border: "1px solid var(--red-b)" }}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                        <path d="M7 1.5L1.5 12.5h11L7 1.5z" stroke="var(--red)" strokeWidth="1.3" strokeLinejoin="round"/>
                        <path d="M7 5.5v3M7 10v.5" stroke="var(--red)" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      <div>
                        <p className="text-[11px] font-semibold" style={{ color: "var(--red)" }}>Materia en riesgo</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--tx2)" }}>
                          <strong style={{ color: "var(--tx)" }}>{lowestSubject.subjectName}</strong> tiene {lowestSubject.finalGrade} — necesitas mejorar para pasar
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Highest subject callout */}
                  {highestSubject && highestSubject.finalGrade !== null && highestSubject.finalGrade >= 90 && (
                    <div className="rounded-xl px-3 py-2.5 flex items-start gap-2.5"
                      style={{ background: "var(--green-d)", border: "1px solid var(--green-b)" }}>
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
                        <circle cx="7" cy="7" r="5.5" stroke="var(--green)" strokeWidth="1.3"/>
                        <path d="M4.5 7l2 2 3.5-3.5" stroke="var(--green)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <p className="text-[11px] font-semibold" style={{ color: "var(--green)" }}>Tu mejor materia</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--tx2)" }}>
                          <strong style={{ color: "var(--tx)" }}>{highestSubject.subjectName}</strong> con {highestSubject.finalGrade} — excelente
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Parcial calculators */}
                  {needsCalc.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[.08em]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                        Para pasar (70)
                      </p>
                      {needsCalc.map((nc, i) => (
                        <div key={i} className="rounded-xl px-3 py-2.5 flex items-center justify-between gap-2"
                          style={{ background: nc.needed > 85 ? "var(--red-d)" : "var(--amber-d)", border: `1px solid ${nc.needed > 85 ? "var(--red-b)" : "var(--amber-b)"}` }}>
                          <p className="text-[11px] truncate" style={{ color: "var(--tx)" }}>{nc.subject}</p>
                          <p className="text-[11px] shrink-0" style={{ fontFamily: "var(--mono)", color: nc.needed > 85 ? "var(--red)" : "var(--amber)" }}>
                            P{nc.parcial} ≥ {nc.needed}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {!hasMindbox ? (
            <div className="rounded-2xl p-6 text-center" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--tx)" }}>Mindbox no configurado</p>
              <p className="text-[12px] mb-4" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Agrega tu contraseña de Mindbox en Configuración para ver tus calificaciones.
              </p>
              <a href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold"
                style={{ background: "var(--blue)", color: "#fff", textDecoration: "none" }}>
                Ir a Configuración
              </a>
            </div>
          ) : grades.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
              <p className="text-[13px] font-semibold mb-1" style={{ color: "var(--tx)" }}>Sin calificaciones</p>
              <p className="text-[11px] mb-4" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
                Presiona "Sincronizar Mindbox" para cargar tus boletas.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {[...byPeriod.entries()].map(([period, pg]) => (
                <PeriodCard key={period} period={period} grades={pg} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
