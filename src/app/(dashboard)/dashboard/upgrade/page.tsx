import { auth } from "@/auth"
import { redirect } from "next/navigation"

const FREE_FEATURES = [
  "Sync ilimitado de tareas desde Moodle",
  "Vista de tareas con filtros",
  "Vista Kanban",
  "Calificaciones en tiempo real",
  "Hasta 3 tareas manuales",
]

const PREMIUM_FEATURES = [
  "Todo lo del plan gratuito",
  "Tareas manuales ilimitadas",
  "Recordatorios por correo antes del vencimiento",
  "Exportar a Google Calendar / Apple Calendar",
  "Historial de calificaciones",
  "Soporte prioritario",
]

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6" fill={color} fillOpacity=".15" stroke={color} strokeOpacity=".3" strokeWidth="1"/>
      <path d="M3.5 6.5l2 2 4-4" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="6.5" cy="6.5" r="6" fill="rgba(255,255,255,0.04)" stroke="var(--b1)" strokeWidth="1"/>
      <path d="M4.5 4.5l4 4M8.5 4.5l-4 4" stroke="var(--tx3)" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

export default async function UpgradePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const isPremium = session.plan === "PREMIUM"

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-1.5" style={{ color: "var(--tx)", letterSpacing: "-.4px" }}>
          {isPremium ? "Eres Premium" : "Actualiza a Premium"}
        </h2>
        <p className="text-[12px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
          {isPremium
            ? "Gracias por apoyar MoodleSync. Tienes acceso a todas las funciones."
            : "Desbloquea tareas ilimitadas, recordatorios y más."}
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">

        {/* FREE card */}
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-semibold" style={{ color: "var(--tx)" }}>Gratuito</p>
            {session.plan === "FREE" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ fontFamily: "var(--mono)", background: "var(--s2)", color: "var(--tx2)", border: "1px solid var(--b1)" }}>
                Plan actual
              </span>
            )}
          </div>
          <p className="text-3xl font-bold mb-1" style={{ color: "var(--tx)", fontFamily: "var(--mono)" }}>$0</p>
          <p className="text-[11px] mb-5" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>Para siempre</p>

          <ul className="space-y-2.5 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--tx2)" }}>
                <span className="mt-px shrink-0"><CheckIcon color="var(--tx2)" /></span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* PREMIUM card */}
        <div className="rounded-2xl p-5 flex flex-col relative overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--blue-b)", boxShadow: "0 0 0 1px var(--blue-b)" }}>
          {/* Glow */}
          <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--blue), transparent)" }} />

          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold" style={{ color: "var(--tx)" }}>Premium</p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ fontFamily: "var(--mono)", background: "var(--blue-d)", color: "var(--blue)", border: "1px solid var(--blue-b)" }}>
                RECOMENDADO
              </span>
            </div>
            {isPremium && (
              <span className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ fontFamily: "var(--mono)", background: "var(--blue-d)", color: "var(--blue)", border: "1px solid var(--blue-b)" }}>
                Plan actual
              </span>
            )}
          </div>

          <p className="text-3xl font-bold mb-1" style={{ color: "var(--tx)", fontFamily: "var(--mono)" }}>
            $49 <span className="text-base font-normal" style={{ color: "var(--tx2)" }}>MXN</span>
          </p>
          <p className="text-[11px] mb-5" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>por mes</p>

          <ul className="space-y-2.5 flex-1">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--tx)" }}>
                <span className="mt-px shrink-0"><CheckIcon color="var(--blue)" /></span>
                {f}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            {isPremium ? (
              <div className="w-full h-10 rounded-xl flex items-center justify-center text-sm font-medium"
                style={{ background: "var(--green-d)", border: "1px solid var(--green-b)", color: "var(--green)" }}>
                Activo
              </div>
            ) : (
              <button
                disabled
                className="w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: "var(--blue)", color: "#fff", cursor: "not-allowed", opacity: 0.7, border: "none" }}
                title="Próximamente — integración MercadoPago en camino"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="5" width="12" height="8" rx="1.5" stroke="white" strokeWidth="1.3"/>
                  <path d="M4 5V3.5a3 3 0 1 1 6 0V5" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
                  <circle cx="7" cy="9" r="1" fill="white"/>
                </svg>
                Suscribirse — Próximamente
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feature comparison table */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: "var(--card)", border: "1px solid var(--b1)" }}>
        <div className="grid grid-cols-3 px-4 py-3 text-[10px] uppercase tracking-[.1em]"
          style={{ fontFamily: "var(--mono)", color: "var(--tx2)", borderBottom: "1px solid var(--b1)", background: "var(--s2)" }}>
          <span>Función</span>
          <span className="text-center">Gratuito</span>
          <span className="text-center">Premium</span>
        </div>
        {[
          ["Sync de tareas Moodle",    true,  true ],
          ["Tareas manuales",          "3",   "∞"  ],
          ["Kanban drag & drop",       true,  true ],
          ["Calificaciones",           true,  true ],
          ["Recordatorios por email",  false, true ],
          ["Export a calendario",      false, true ],
          ["Historial calificaciones", false, true ],
        ].map(([label, free, premium], i) => (
          <div key={String(label)}
            className="grid grid-cols-3 px-4 py-3 text-[12px]"
            style={{ borderBottom: i < 6 ? "1px solid var(--b1)" : "none", color: "var(--tx2)" }}>
            <span style={{ color: "var(--tx)" }}>{label}</span>
            <span className="flex justify-center items-center">
              {free === true ? <CheckIcon color="var(--tx2)" /> :
               free === false ? <XIcon /> :
               <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx2)" }}>{free}</span>}
            </span>
            <span className="flex justify-center items-center">
              {premium === true ? <CheckIcon color="var(--blue)" /> :
               premium === false ? <XIcon /> :
               <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--blue)", fontWeight: 600 }}>{premium}</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Coming soon notice */}
      {!isPremium && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: "var(--s2)", border: "1px solid var(--b1)" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5">
            <circle cx="7" cy="7" r="6" stroke="var(--tx2)" strokeWidth="1.2"/>
            <path d="M7 5v3M7 9.5v.3" stroke="var(--tx2)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <p className="text-[11px] leading-relaxed" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>
            El pago con MercadoPago estará disponible próximamente. Si quieres acceso anticipado,{" "}
            <strong style={{ color: "var(--tx)" }}>contáctanos por WhatsApp</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
