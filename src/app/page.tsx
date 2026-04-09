import Link from "next/link"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function LandingPage() {
  const session = await auth()
  if (session?.user?.id) redirect("/dashboard/tareas")

  return (
    <div style={{ background: "var(--bg)", color: "var(--tx)", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-6 md:px-12 h-[60px] sticky top-0 z-50"
        style={{ background: "rgba(10,10,11,.85)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--b1)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--blue)" }}>
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="4" fill="white"/>
              <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.8"/>
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: "var(--tx)" }}>MoodleSync</span>
          <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 rounded"
            style={{ fontFamily: "var(--mono)", background: "var(--blue-d)", color: "var(--blue)", border: "1px solid var(--blue-b)" }}>
            by ONYX Inc.
          </span>
        </div>
        <Link href="/login"
          className="flex items-center h-8 px-4 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
          style={{ background: "var(--blue)", color: "#fff", textDecoration: "none" }}>
          Iniciar sesión
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center text-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(to right,#4b8cf8 1px,transparent 1px),linear-gradient(to bottom,#4b8cf8 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          opacity: .025,
        }} />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top,rgba(75,140,248,.12) 0%,transparent 70%)" }} />

        {/* Badge */}
        <div className="relative mb-6 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px]"
          style={{ fontFamily: "var(--mono)", background: "var(--blue-d)", color: "var(--blue)", border: "1px solid var(--blue-b)" }}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--blue)" }} />
          Para estudiantes del ITCG · TecNM Ciudad Guzmán
        </div>

        <h1 className="relative text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-5 max-w-3xl"
          style={{ letterSpacing: "-1.5px" }}>
          Todas tus tareas del ITCG,{" "}
          <span style={{ color: "var(--blue)" }}>en un solo lugar.</span>
        </h1>

        <p className="relative text-base md:text-lg leading-relaxed mb-8 max-w-xl" style={{ color: "var(--tx2)" }}>
          Sincroniza automáticamente con Moodle, organiza por estado y nunca más
          pierdas una fecha de entrega.
        </p>

        <div className="relative flex items-center gap-3">
          <Link href="/login"
            className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[.98]"
            style={{ background: "var(--blue)", color: "#fff", textDecoration: "none" }}>
            Empezar gratis
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M2 6.5h9M7.5 3l3.5 3.5-3.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <a href="#features"
            className="flex items-center h-11 px-5 rounded-xl text-sm transition-all hover:opacity-80"
            style={{ background: "var(--s2)", border: "1px solid var(--b1)", color: "var(--tx2)", textDecoration: "none" }}>
            Ver funciones
          </a>
        </div>

        {/* Credential note */}
        <p className="relative mt-5 text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx3)" }}>
          Usa las mismas credenciales del portal ITCG · sin registros extra
        </p>
      </section>

      {/* ── STATS STRIP ── */}
      <div className="border-y" style={{ borderColor: "var(--b1)", background: "var(--card)" }}>
        <div className="max-w-3xl mx-auto px-6 py-6 grid grid-cols-3 gap-4 text-center">
          {[
            { value: "100%", label: "Gratis para empezar" },
            { value: "Auto", label: "Sincronización Moodle" },
            { value: "0",    label: "Registros adicionales" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold mb-0.5" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>{value}</p>
              <p className="text-[11px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="px-6 md:px-12 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[11px] uppercase tracking-[.15em] mb-3" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>
            Funciones
          </p>
          <h2 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: "-0.8px" }}>
            Diseñado para el ritmo del semestre
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M10 2A4 4 0 0 1 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10 2l2 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <rect x="2" y="8" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 13h4M6 16h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              ),
              title: "Sync automático",
              desc: "Conecta con tu Moodle del ITCG y trae todas tus tareas pendientes al instante. Se actualiza con un clic.",
            },
            {
              icon: (
                <svg viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="5" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="9" y="4" width="5" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                  <rect x="16" y="4" width="5" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              ),
              title: "Kanban drag & drop",
              desc: "Mueve tus tareas entre Pendiente, Entregada y Archivada. Vista visual sin librerías pesadas.",
            },
            {
              icon: (
                <svg viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 7h10M5 10.5h7M5 14h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              ),
              title: "Calificaciones en vivo",
              desc: "Ve tus notas por materia directamente desde Moodle, sin tener que entrar al portal.",
            },
            {
              icon: (
                <svg viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 6v4.5l2.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              ),
              title: "Urgentes primero",
              desc: "Las tareas se clasifican automáticamente: vencidas, urgentes (menos de 3 días) y pendientes.",
            },
            {
              icon: (
                <svg viewBox="0 0 20 20" fill="none">
                  <path d="M4 6h12M4 10h8M4 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="16" cy="14" r="3" fill="var(--blue-d)" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M15 14h2M16 13v2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
              ),
              title: "Tareas manuales",
              desc: "Agrega tareas que no vienen de Moodle — proyectos, exámenes, entregables de otras plataformas.",
            },
            {
              icon: (
                <svg viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 8h16" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M6 1v4M14 1v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M6 12h4M6 15h8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
                </svg>
              ),
              title: "Export a calendario",
              desc: "Descarga tus tareas como archivo .ics y agrégalas a Google Calendar o Apple Calendar.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title}
              className="rounded-2xl p-5 flex flex-col gap-3 group transition-all"
              style={{ background: "var(--card)", border: "1px solid var(--b1)" }}
              onMouseEnter={() => {}} // hover handled by CSS
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "var(--blue-d)", border: "1px solid var(--blue-b)", color: "var(--blue)" }}>
                <span className="w-5 h-5">{icon}</span>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--tx)" }}>{title}</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--tx2)" }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6 md:px-12 py-16" style={{ background: "var(--card)", borderTop: "1px solid var(--b1)", borderBottom: "1px solid var(--b1)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] uppercase tracking-[.15em] mb-3" style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>
              Cómo funciona
            </p>
            <h2 className="text-3xl font-bold tracking-tight" style={{ letterSpacing: "-0.8px" }}>
              En 3 pasos, listo.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Inicia sesión",
                desc: "Usa tu número de control y contraseña del portal ITCG. Sin crear cuenta nueva.",
              },
              {
                step: "02",
                title: "Sync automático",
                desc: "Traemos todas tus tareas de Moodle: materia, fecha de entrega y estado.",
              },
              {
                step: "03",
                title: "Organiza y entrega",
                desc: "Vista lista, kanban o por urgencia. Marca como entregada cuando termines.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col gap-3">
                <div className="text-3xl font-bold" style={{ fontFamily: "var(--mono)", color: "var(--blue)", opacity: 0.35 }}>
                  {step}
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--tx)" }}>{title}</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "var(--tx2)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-6 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center,rgba(75,140,248,.06) 0%,transparent 65%)" }} />
        <p className="relative text-[11px] uppercase tracking-[.15em] mb-4"
          style={{ fontFamily: "var(--mono)", color: "var(--blue)" }}>
          Gratis para empezar
        </p>
        <h2 className="relative text-3xl md:text-4xl font-bold mb-4 tracking-tight" style={{ letterSpacing: "-1px" }}>
          Deja de perder fechas.
        </h2>
        <p className="relative text-base mb-8 max-w-md mx-auto" style={{ color: "var(--tx2)" }}>
          Entra con tu cuenta del ITCG y ten tus tareas organizadas en menos de un minuto.
        </p>
        <Link href="/login"
          className="inline-flex items-center gap-2 h-11 px-8 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
          style={{ background: "var(--blue)", color: "#fff", textDecoration: "none" }}>
          Empezar gratis
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 6.5h9M7.5 3l3.5 3.5-3.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-12 py-6 flex items-center justify-between flex-wrap gap-3"
        style={{ borderTop: "1px solid var(--b1)", background: "var(--card)" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "var(--blue)" }}>
            <svg width="12" height="12" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="4" fill="white"/>
              <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.8"/>
            </svg>
          </div>
          <span className="text-xs font-semibold" style={{ color: "var(--tx)" }}>MoodleSync</span>
          <span className="text-[10px]" style={{ fontFamily: "var(--mono)", color: "var(--tx2)" }}>· by ONYX Inc. · 2026</span>
        </div>
        <Link href="/login" className="text-[11px] transition-all hover:opacity-80"
          style={{ fontFamily: "var(--mono)", color: "var(--tx2)", textDecoration: "none" }}>
          Iniciar sesión →
        </Link>
      </footer>
    </div>
  )
}
